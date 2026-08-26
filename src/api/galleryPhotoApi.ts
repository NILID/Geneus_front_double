import { API_BASE } from '../auth/authApi';
import { getStoredToken } from '../auth/storage';
import { normalizeRegion, type GalleryPersonTagInput } from '../gallery/galleryPhotoRegion';
import { MAX_COMMENT_BODY } from './ideaApi';
import type { IdeaComment } from './ideaApi';

export type GalleryPhotoComment = IdeaComment;

export { MAX_COMMENT_BODY };

export interface GalleryTaggedPerson {
  id: number;
  chart_external_id: string;
  first_name: string;
  last_name: string | null;
  region?: { x: number; y: number; width: number; height: number } | null;
}

/** Элемент сетки галереи и полноэкранного просмотра */
export interface GalleryMasonryItem {
  id: number;
  caption: string | null;
  taken_year?: number | null;
  image_url: string | null;
  created_at: string;
  uploaded_by_email?: string | null;
  tagged_people?: GalleryTaggedPerson[];
  user_id?: number;
  comments_count?: number;
}

export interface GalleryPhoto {
  id: number;
  user_id: number;
  uploaded_by_email: string | null;
  caption: string | null;
  /** Год съёмки, если указан вручную */
  taken_year: number | null;
  image_url: string | null;
  created_at: string;
  tagged_people: GalleryTaggedPerson[];
  comments_count: number;
}

export interface GalleryPhotosPaginationMeta {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface GalleryPhotosPageResult {
  photos: GalleryPhoto[];
  meta: GalleryPhotosPaginationMeta;
}

/** Размер страницы галереи (совпадает с Pagy::DEFAULT[:limit] на бэке). */
export const GALLERY_PHOTOS_PAGE_SIZE = 10;

function authHeaders(jsonBody: boolean): Headers {
  const h = new Headers();
  h.set('Accept', 'application/json');
  if (jsonBody) {
    h.set('Content-Type', 'application/json');
  }
  const t = getStoredToken();
  if (t) {
    h.set('Authorization', `Bearer ${t}`);
  }
  return h;
}

/** Safari may reuse cached JSON; blob URLs in the payload expire (Active Storage signed URLs). */
const NO_STORE: Pick<RequestInit, 'cache'> = { cache: 'no-store' };

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    if (body && typeof body === 'object') {
      const o = body as Record<string, unknown>;
      if (Array.isArray(o.errors) && o.errors.every((x) => typeof x === 'string')) {
        return (o.errors as string[]).join(', ');
      }
      if (typeof o.error === 'string') {
        return o.error;
      }
    }
  } catch {
    /* ignore */
  }
  return `${res.status} ${res.statusText}`;
}

function normalizeGalleryPhotosMeta(raw: unknown): GalleryPhotosPaginationMeta {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const page = Number(o.page);
  const perPage = Number(o.per_page);
  const totalCount = Number(o.total_count);
  const totalPages = Number(o.total_pages);
  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    per_page: Number.isFinite(perPage) && perPage > 0 ? perPage : GALLERY_PHOTOS_PAGE_SIZE,
    total_count: Number.isFinite(totalCount) && totalCount >= 0 ? totalCount : 0,
    total_pages: Number.isFinite(totalPages) && totalPages >= 0 ? totalPages : 0,
  };
}

export async function fetchGalleryPhotosPage(
  page = 1,
  perPage = GALLERY_PHOTOS_PAGE_SIZE,
): Promise<GalleryPhotosPageResult> {
  const sp = new URLSearchParams();
  sp.set('page', String(page));
  sp.set('per_page', String(perPage));
  const res = await fetch(`${API_BASE}/api/v1/gallery_photos?${sp}`, {
    ...NO_STORE,
    headers: authHeaders(false),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const json: unknown = await res.json();
  const body = json as { gallery_photos?: GalleryPhoto[]; meta?: unknown };
  const list = body.gallery_photos;
  if (!Array.isArray(list)) {
    throw new Error('Некорректный ответ сервера');
  }
  return {
    photos: list.map(normalizeGalleryPhoto),
    meta: normalizeGalleryPhotosMeta(body.meta),
  };
}

export async function fetchGalleryPhoto(id: number): Promise<GalleryPhoto> {
  const res = await fetch(`${API_BASE}/api/v1/gallery_photos/${id}`, {
    ...NO_STORE,
    headers: authHeaders(false),
  });
  if (res.status === 404) {
    throw new Error('Фото не найдено');
  }
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const json: unknown = await res.json();
  const photo = (json as { gallery_photo?: GalleryPhoto }).gallery_photo;
  if (!photo) {
    throw new Error('Некорректный ответ сервера');
  }
  return normalizeGalleryPhoto(photo);
}

/** Первая страница с увеличенным лимитом (например, превью на главной). */
export async function fetchGalleryPhotos(perPage?: number): Promise<GalleryPhoto[]> {
  const { photos } = await fetchGalleryPhotosPage(1, perPage ?? GALLERY_PHOTOS_PAGE_SIZE);
  return photos;
}

function normalizeTaggedPerson(p: GalleryTaggedPerson): GalleryTaggedPerson {
  return {
    ...p,
    region: normalizeRegion(p.region),
  };
}

export function normalizeGalleryPhoto(p: GalleryPhoto): GalleryPhoto {
  const ty = p.taken_year;
  const cc = p.comments_count;
  return {
    ...p,
    user_id: typeof p.user_id === 'number' ? p.user_id : 0,
    uploaded_by_email: p.uploaded_by_email ?? null,
    taken_year: typeof ty === 'number' && !Number.isNaN(ty) ? ty : null,
    tagged_people: Array.isArray(p.tagged_people)
      ? p.tagged_people.map((t) => normalizeTaggedPerson(t as GalleryTaggedPerson))
      : [],
    comments_count: typeof cc === 'number' && !Number.isNaN(cc) ? cc : 0,
  };
}

export type { GalleryPersonTagInput };

export async function uploadGalleryPhoto(
  file: File,
  caption?: string | null,
  personIds?: number[],
  takenYear?: number | null,
): Promise<GalleryPhoto> {
  const fd = new FormData();
  fd.append('gallery_photo[image]', file);
  if (caption != null && caption.trim() !== '') {
    fd.append('gallery_photo[caption]', caption.trim());
  }
  if (takenYear != null && !Number.isNaN(takenYear)) {
    fd.append('gallery_photo[taken_year]', String(takenYear));
  }
  if (personIds !== undefined) {
    for (const id of personIds) {
      fd.append('gallery_photo[person_ids][]', String(id));
    }
  }
  const h = authHeaders(false);
  const res = await fetch(`${API_BASE}/api/v1/gallery_photos`, {
    ...NO_STORE,
    method: 'POST',
    headers: h,
    body: fd,
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const json: unknown = await res.json();
  const photo = (json as { gallery_photo?: GalleryPhoto }).gallery_photo;
  if (!photo) {
    throw new Error('Некорректный ответ сервера');
  }
  return normalizeGalleryPhoto(photo);
}

export interface GalleryPhotoUpdateInput {
  /** Omit to leave caption unchanged. */
  caption?: string | null;
  /** Omit to leave unchanged; null clears. */
  taken_year?: number | null;
  /** If set, first step uses multipart/form-data with the new file. */
  image?: File | null;
  /** If set (including []), server replaces tags. Omit to leave tags unchanged. */
  person_ids?: number[];
  /** Полная замена отметок с координатами областей (приоритетнее person_ids). */
  person_tags?: GalleryPersonTagInput[];
}

function personTagsToPayload(tags: GalleryPersonTagInput[]): Record<string, unknown>[] {
  return tags.map((t) => {
    const row: Record<string, unknown> = { person_id: t.person_id };
    if (t.region) {
      row.region_x = t.region.x;
      row.region_y = t.region.y;
      row.region_width = t.region.width;
      row.region_height = t.region.height;
    }
    return row;
  });
}

async function patchGalleryPhotoJson(
  id: number,
  payload: Record<string, unknown>,
): Promise<GalleryPhoto> {
  const url = `${API_BASE}/api/v1/gallery_photos/${id}`;
  const res = await fetch(url, {
    ...NO_STORE,
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ gallery_photo: payload }),
  });
  if (res.status === 404) {
    throw new Error('Фото не найдено');
  }
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const json: unknown = await res.json();
  const photo = (json as { gallery_photo?: GalleryPhoto }).gallery_photo;
  if (!photo) {
    throw new Error('Некорректный ответ сервера');
  }
  return normalizeGalleryPhoto(photo);
}

export async function updateGalleryPhoto(
  id: number,
  input: GalleryPhotoUpdateInput,
): Promise<GalleryPhoto> {
  const hasImage = input.image instanceof File;
  const url = `${API_BASE}/api/v1/gallery_photos/${id}`;

  if (hasImage) {
    const fd = new FormData();
    if (input.caption !== undefined) {
      fd.append('gallery_photo[caption]', input.caption?.trim() ?? '');
    }
    if (input.taken_year !== undefined) {
      fd.append(
        'gallery_photo[taken_year]',
        input.taken_year == null || Number.isNaN(input.taken_year) ? '' : String(input.taken_year),
      );
    }
    fd.append('gallery_photo[image]', input.image!);
    if (input.person_tags !== undefined) {
      for (const tag of personTagsToPayload(input.person_tags)) {
        for (const [k, v] of Object.entries(tag)) {
          fd.append(`gallery_photo[person_tags][][${k}]`, String(v));
        }
      }
    } else if (input.person_ids !== undefined) {
      for (const pid of input.person_ids) {
        fd.append('gallery_photo[person_ids][]', String(pid));
      }
    }
    const res = await fetch(url, {
      ...NO_STORE,
      method: 'PATCH',
      headers: authHeaders(false),
      body: fd,
    });
    if (res.status === 404) {
      throw new Error('Фото не найдено');
    }
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
    const json: unknown = await res.json();
    const photo = (json as { gallery_photo?: GalleryPhoto }).gallery_photo;
    if (!photo) {
      throw new Error('Некорректный ответ сервера');
    }
    let result = normalizeGalleryPhoto(photo);
    if (input.person_tags !== undefined && input.person_tags.length === 0) {
      result = await patchGalleryPhotoJson(id, { person_tags: [] });
    } else if (input.person_ids !== undefined && input.person_ids.length === 0) {
      result = await patchGalleryPhotoJson(id, { person_ids: [] });
    }
    return result;
  }

  const payload: Record<string, unknown> = {};
  if (input.caption !== undefined) {
    payload.caption =
      input.caption == null || `${input.caption}`.trim() === '' ? null : input.caption.trim();
  }
  if (input.taken_year !== undefined) {
    payload.taken_year =
      input.taken_year == null || Number.isNaN(input.taken_year) ? null : input.taken_year;
  }
  if (input.person_tags !== undefined) {
    payload.person_tags = personTagsToPayload(input.person_tags);
  } else if (input.person_ids !== undefined) {
    payload.person_ids = input.person_ids;
  }
  if (Object.keys(payload).length === 0) {
    throw new Error('Нечего обновить');
  }

  return patchGalleryPhotoJson(id, payload);
}

export async function deleteGalleryPhoto(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/gallery_photos/${id}`, {
    ...NO_STORE,
    method: 'DELETE',
    headers: authHeaders(false),
  });
  if (res.status === 404) {
    throw new Error('Фото не найдено');
  }
  if (!res.ok && res.status !== 204) {
    throw new Error(await parseErrorMessage(res));
  }
}

function normalizeGalleryPhotoComment(raw: unknown): GalleryPhotoComment {
  const o = raw as Record<string, unknown>;
  return {
    id: Number(o.id),
    user_id: Number(o.user_id),
    author_email: typeof o.author_email === 'string' ? o.author_email : null,
    body: typeof o.body === 'string' ? o.body : '',
    created_at: typeof o.created_at === 'string' ? o.created_at : '',
  };
}

export async function fetchGalleryPhotoComments(photoId: number): Promise<GalleryPhotoComment[]> {
  const res = await fetch(`${API_BASE}/api/v1/gallery_photos/${photoId}/comments`, {
    ...NO_STORE,
    headers: authHeaders(false),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const json: unknown = await res.json();
  const list = (json as { comments?: unknown[] }).comments;
  if (!Array.isArray(list)) {
    throw new Error('Некорректный ответ сервера');
  }
  return list.map(normalizeGalleryPhotoComment);
}

export async function createGalleryPhotoComment(
  photoId: number,
  body: string,
): Promise<{ comment: GalleryPhotoComment; comments_count: number }> {
  const res = await fetch(`${API_BASE}/api/v1/gallery_photos/${photoId}/comments`, {
    ...NO_STORE,
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ comment: { body } }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const json: unknown = await res.json();
  const o = json as Record<string, unknown>;
  const comment = o.comment;
  const commentsCount = o.comments_count;
  if (!comment || typeof comment !== 'object') {
    throw new Error('Некорректный ответ сервера');
  }
  if (typeof commentsCount !== 'number' || Number.isNaN(commentsCount)) {
    throw new Error('Некорректный ответ сервера');
  }
  return { comment: normalizeGalleryPhotoComment(comment), comments_count: commentsCount };
}
