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
