/** Нормализованная область на фото (доли 0–1 от размеров изображения). */
export interface GalleryPhotoRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GalleryPersonTagInput {
  person_id: number;
  region?: GalleryPhotoRegion | null;
}

function roundCoord(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

function regionSnapshot(r: GalleryPhotoRegion | null | undefined): GalleryPhotoRegion | null {
  if (!r) {
    return null;
  }
  return {
    x: roundCoord(r.x),
    y: roundCoord(r.y),
    width: roundCoord(r.width),
    height: roundCoord(r.height),
  };
}

/** Сравнение отметок для проверки несохранённых изменений. */
export function arePersonTagsEqual(a: GalleryPersonTagInput[], b: GalleryPersonTagInput[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const sorted = (list: GalleryPersonTagInput[]) =>
    [...list].sort((x, y) => x.person_id - y.person_id);
  const sa = sorted(a);
  const sb = sorted(b);
  return sa.every((tag, i) => {
    const other = sb[i];
    if (tag.person_id !== other.person_id) {
      return false;
    }
    const ra = regionSnapshot(tag.region);
    const rb = regionSnapshot(other.region);
    if (ra == null && rb == null) {
      return true;
    }
    if (!ra || !rb) {
      return false;
    }
    return ra.x === rb.x && ra.y === rb.y && ra.width === rb.width && ra.height === rb.height;
  });
}

export function normalizeRegion(raw: unknown): GalleryPhotoRegion | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const x = Number(o.x);
  const y = Number(o.y);
  const width = Number(o.width);
  const height = Number(o.height);
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }
  return { x, y, width, height };
}

export function regionToPercent(r: GalleryPhotoRegion): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  return {
    left: `${r.x * 100}%`,
    top: `${r.y * 100}%`,
    width: `${r.width * 100}%`,
    height: `${r.height * 100}%`,
  };
}

export function clampRegion(r: GalleryPhotoRegion): GalleryPhotoRegion {
  let { x, y, width, height } = r;
  width = Math.max(0.01, Math.min(width, 1));
  height = Math.max(0.01, Math.min(height, 1));
  x = Math.max(0, Math.min(x, 1 - width));
  y = Math.max(0, Math.min(y, 1 - height));
  return { x, y, width, height };
}

/** Пиксельный прямоугольник внутри контейнера изображения → нормализованная область. */
export type RegionEditHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export function regionToPixelRect(
  r: GalleryPhotoRegion,
  containerWidth: number,
  containerHeight: number,
): { left: number; top: number; width: number; height: number } {
  const c = clampRegion(r);
  return {
    left: c.x * containerWidth,
    top: c.y * containerHeight,
    width: c.width * containerWidth,
    height: c.height * containerHeight,
  };
}

/** Смещение/масштаб области в нормализованных координатах (dx, dy — доли 0–1). */
export function applyRegionEdit(
  start: GalleryPhotoRegion,
  handle: RegionEditHandle,
  delta: { dx: number; dy: number },
): GalleryPhotoRegion {
  let { x, y, width, height } = start;
  const { dx, dy } = delta;
  switch (handle) {
    case 'move':
      x += dx;
      y += dy;
      break;
    case 'e':
      width += dx;
      break;
    case 'w':
      x += dx;
      width -= dx;
      break;
    case 's':
      height += dy;
      break;
    case 'n':
      y += dy;
      height -= dy;
      break;
    case 'se':
      width += dx;
      height += dy;
      break;
    case 'nw':
      x += dx;
      y += dy;
      width -= dx;
      height -= dy;
      break;
    case 'ne':
      y += dy;
      width += dx;
      height -= dy;
      break;
    case 'sw':
      x += dx;
      width -= dx;
      height += dy;
      break;
    default:
      break;
  }
  return clampRegion({ x, y, width, height });
}

export function pixelRectToRegion(
  rect: { left: number; top: number; width: number; height: number },
  containerWidth: number,
  containerHeight: number,
): GalleryPhotoRegion | null {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return null;
  }
  if (rect.width < 4 || rect.height < 4) {
    return null;
  }
  return clampRegion({
    x: rect.left / containerWidth,
    y: rect.top / containerHeight,
    width: rect.width / containerWidth,
    height: rect.height / containerHeight,
  });
}
