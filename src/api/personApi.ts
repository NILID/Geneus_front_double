import { API_BASE } from '../auth/authApi';
import { getStoredToken } from '../auth/storage';

export interface PersonSummary {
  id: number;
  chart_external_id: string;
  first_name: string;
  last_name: string | null;
}

export interface TaggedGalleryPhoto {
  id: number;
  caption: string | null;
  image_url: string | null;
  created_at: string;
}

export interface PersonDetail {
  id: number;
  chart_id: string | null;
  chart_external_id: string;
  first_name: string;
  last_name: string | null;
  gender: string;
  bio: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  location_of_birth: string | null;
  location_of_death: string | null;
  avatar_url: string | null;
  parents: PersonSummary[];
  partners: PersonSummary[];
  children: PersonSummary[];
  tagged_gallery_photos: TaggedGalleryPhoto[];
}

function authHeaders(): Headers {
  const h = new Headers();
  h.set('Accept', 'application/json');
  const t = getStoredToken();
  if (t) {
    h.set('Authorization', `Bearer ${t}`);
  }
  return h;
}

/** Склеивает имя и фамилию для заголовков и списков. */
export function personDisplayName(p: {
  first_name: string;
  last_name: string | null | undefined;
}): string {
  const parts = [p.first_name?.trim(), p.last_name?.trim()].filter(
    (s): s is string => Boolean(s),
  );
  return parts.join(' ');
}

export async function fetchPerson(id: string): Promise<PersonDetail> {
  const res = await fetch(
    `${API_BASE}/api/v1/people/${encodeURIComponent(id)}`,
    { headers: authHeaders() },
  );
  if (res.status === 404) {
    throw new Error('Персона не найдена');
  }
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const body: unknown = await res.json();
      if (body && typeof body === 'object' && typeof (body as { error?: string }).error === 'string') {
        msg = (body as { error: string }).error;
      }
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const json: unknown = await res.json();
  const o = json as { person?: PersonDetail };
  if (!o.person) {
    throw new Error('Не удалось получить персон');
  }
  const p = o.person;
  return {
    ...p,
    tagged_gallery_photos: Array.isArray(p.tagged_gallery_photos) ? p.tagged_gallery_photos : [],
  };
}

export interface PersonUpdateInput {
  first_name: string;
  last_name: string | null;
  gender: string;
  bio: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  location_of_birth: string | null;
  location_of_death: string | null;
  /** If set, request is sent as multipart/form-data with the file. */
  avatar?: File | null;
}

function trimToNull(s: string | null | undefined): string | null {
  if (s == null) {
    return null;
  }
  const t = s.trim();
  return t === '' ? null : t;
}

function dateInputToApi(isoOrEmpty: string | null | undefined): string | null {
  const t = trimToNull(isoOrEmpty ?? null);
  if (t == null) {
    return null;
  }
  return t.length >= 10 ? t.slice(0, 10) : t;
}

function appendPersonFormData(fd: FormData, input: PersonUpdateInput) {
  const p = (key: string, value: string) => {
    fd.append(`person[${key}]`, value);
  };
  p('first_name', input.first_name.trim());
  p('last_name', trimToNull(input.last_name) ?? '');
  p('gender', input.gender);
  p('bio', trimToNull(input.bio) ?? '');
  p('date_of_birth', dateInputToApi(input.date_of_birth) ?? '');
  p('date_of_death', dateInputToApi(input.date_of_death) ?? '');
  p('location_of_birth', trimToNull(input.location_of_birth) ?? '');
  p('location_of_death', trimToNull(input.location_of_death) ?? '');
}

export async function updatePerson(
  id: string,
  input: PersonUpdateInput,
): Promise<PersonDetail> {
  const hasAvatar = input.avatar instanceof File;
  const res = await fetch(
    `${API_BASE}/api/v1/people/${encodeURIComponent(id)}`,
    hasAvatar
      ? (() => {
          const fd = new FormData();
          appendPersonFormData(fd, input);
          fd.append('person[avatar]', input.avatar!);
          const h = authHeaders();
          return {
            method: 'PATCH' as const,
            headers: h,
            body: fd,
          };
        })()
      : {
          method: 'PATCH' as const,
          headers: (() => {
            const h = authHeaders();
            h.set('Content-Type', 'application/json');
            return h;
          })(),
          body: JSON.stringify({
            person: {
              first_name: input.first_name.trim(),
              last_name: trimToNull(input.last_name),
              gender: input.gender,
              bio: trimToNull(input.bio),
              date_of_birth: dateInputToApi(input.date_of_birth),
              date_of_death: dateInputToApi(input.date_of_death),
              location_of_birth: trimToNull(input.location_of_birth),
              location_of_death: trimToNull(input.location_of_death),
            },
          }),
        },
  );
  if (res.status === 404) {
    throw new Error('Персона не найдена');
  }
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const body: unknown = await res.json();
      if (body && typeof body === 'object' && 'errors' in body) {
        const errs = (body as { errors?: unknown }).errors;
        if (Array.isArray(errs) && errs.length > 0) {
          msg = errs.map(String).join(' ');
        }
      } else if (
        body &&
        typeof body === 'object' &&
        typeof (body as { error?: string }).error === 'string'
      ) {
        msg = (body as { error: string }).error;
      }
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const json: unknown = await res.json();
  const o = json as { person?: PersonDetail };
  if (!o.person) {
    throw new Error('Не удалось обновить персону');
  }
  const p = o.person;
  return {
    ...p,
    tagged_gallery_photos: Array.isArray(p.tagged_gallery_photos) ? p.tagged_gallery_photos : [],
  };
}
