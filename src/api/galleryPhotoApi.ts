import { API_BASE } from '../auth/authApi';
import { getStoredToken } from '../auth/storage';

export interface GalleryTaggedPerson {
  id: number;
  chart_external_id: string;
  first_name: string;
  last_name: string | null;
}

export interface GalleryPhoto {
  id: number;
  user_id: number;
  uploaded_by_email: string | null;
  caption: string | null;
  image_url: string | null;
  created_at: string;
  tagged_people: GalleryTaggedPerson[];
}

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

export async function fetchGalleryPhotos(): Promise<GalleryPhoto[]> {
  const res = await fetch(`${API_BASE}/api/v1/gallery_photos`, {
    headers: authHeaders(false),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const json: unknown = await res.json();
  const list = (json as { gallery_photos?: GalleryPhoto[] }).gallery_photos;
  if (!Array.isArray(list)) {
    throw new Error('Некорректный ответ сервера');
  }
  return list.map(normalizeGalleryPhoto);
}

function normalizeGalleryPhoto(p: GalleryPhoto): GalleryPhoto {
  return {
    ...p,
    tagged_people: Array.isArray(p.tagged_people) ? p.tagged_people : [],
  };
}

export async function uploadGalleryPhoto(
  file: File,
  caption?: string | null,
  personIds?: number[],
): Promise<GalleryPhoto> {
  const fd = new FormData();
  fd.append('gallery_photo[image]', file);
  if (caption != null && caption.trim() !== '') {
    fd.append('gallery_photo[caption]', caption.trim());
  }
  if (personIds !== undefined) {
    for (const id of personIds) {
      fd.append('gallery_photo[person_ids][]', String(id));
    }
  }
  const h = authHeaders(false);
  const res = await fetch(`${API_BASE}/api/v1/gallery_photos`, {
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
  /** If set, first step uses multipart/form-data with the new file. */
  image?: File | null;
  /** If set (including []), server replaces tags. Omit to leave tags unchanged. */
  person_ids?: number[];
}

async function patchGalleryPhotoJson(
  id: number,
  payload: Record<string, unknown>,
): Promise<GalleryPhoto> {
  const url = `${API_BASE}/api/v1/gallery_photos/${id}`;
  const res = await fetch(url, {
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
    fd.append('gallery_photo[image]', input.image!);
    if (input.person_ids !== undefined) {
      for (const pid of input.person_ids) {
        fd.append('gallery_photo[person_ids][]', String(pid));
      }
    }
    const res = await fetch(url, {
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
    // multipart не передаёт пустой массив person_ids — вторым запросом синхронизируем отметки
    if (input.person_ids !== undefined && input.person_ids.length === 0) {
      result = await patchGalleryPhotoJson(id, { person_ids: [] });
    }
    return result;
  }

  const payload: Record<string, unknown> = {};
  if (input.caption !== undefined) {
    payload.caption =
      input.caption == null || `${input.caption}`.trim() === '' ? null : input.caption.trim();
  }
  if (input.person_ids !== undefined) {
    payload.person_ids = input.person_ids;
  }
  if (Object.keys(payload).length === 0) {
    throw new Error('Нечего обновить');
  }

  return patchGalleryPhotoJson(id, payload);
}

export async function deleteGalleryPhoto(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/gallery_photos/${id}`, {
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
