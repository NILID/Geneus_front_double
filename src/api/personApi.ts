import { API_BASE } from '../auth/authApi';
import { getStoredToken } from '../auth/storage';
import { normalizeGalleryPhoto, type GalleryPhoto } from './galleryPhotoApi';
import type { PersonFact } from './personFactsApi';

export interface PersonSummary {
  id: number;
  chart_external_id: string;
  first_name: string;
  last_name: string | null;
}

/** Элемент списка «недавно обновлённые» на главной. */
export interface PersonHomeRow {
  id: number;
  chart_external_id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string;
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
  birth_date_year_only: boolean;
  death_date_year_only: boolean;
  location_of_birth: string | null;
  location_of_death: string | null;
  birth_latitude: number | null;
  birth_longitude: number | null;
  death_latitude: number | null;
  death_longitude: number | null;
  avatar_url: string | null;
  parents: PersonSummary[];
  partners: PersonSummary[];
  children: PersonSummary[];
  tagged_gallery_photos: GalleryPhoto[];
  /** До трёх самых новых фактов (полный список — отдельный запрос / страница). */
  recent_person_facts: PersonFact[];
}

/** Данные для карты «Места» (метки рождения и смерти). */
export interface PersonMapLocation {
  id: number;
  chart_external_id: string;
  first_name: string;
  last_name: string | null;
  location_of_birth: string | null;
  location_of_death: string | null;
  birth_latitude: number | null;
  birth_longitude: number | null;
  death_latitude: number | null;
  death_longitude: number | null;
}

function parseCoord(v: unknown): number | null {
  if (v == null) {
    return null;
  }
  if (typeof v === 'number' && !Number.isNaN(v)) {
    return v;
  }
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function normalizePersonDetail(raw: PersonDetail): PersonDetail {
  return {
    ...raw,
    birth_date_year_only: Boolean(raw.birth_date_year_only),
    death_date_year_only: Boolean(raw.death_date_year_only),
    birth_latitude: parseCoord(raw.birth_latitude as unknown),
    birth_longitude: parseCoord(raw.birth_longitude as unknown),
    death_latitude: parseCoord(raw.death_latitude as unknown),
    death_longitude: parseCoord(raw.death_longitude as unknown),
    tagged_gallery_photos: Array.isArray(raw.tagged_gallery_photos)
      ? raw.tagged_gallery_photos.map((gp) => normalizeGalleryPhoto(gp as GalleryPhoto))
      : [],
    recent_person_facts: Array.isArray(raw.recent_person_facts) ? raw.recent_person_facts : [],
  };
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
  return normalizePersonDetail(o.person);
}

export async function fetchRecentPeople(): Promise<PersonHomeRow[]> {
  const res = await fetch(`${API_BASE}/api/v1/people/recent`, {
    headers: authHeaders(),
  });
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
  const o = json as { people?: PersonHomeRow[] };
  if (!Array.isArray(o.people)) {
    throw new Error('Некорректный ответ сервера');
  }
  return o.people;
}

export async function fetchPeopleMapLocations(): Promise<PersonMapLocation[]> {
  const res = await fetch(`${API_BASE}/api/v1/people/map_locations`, {
    headers: authHeaders(),
  });
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
  const o = json as { people?: PersonMapLocation[] };
  const list = Array.isArray(o.people) ? o.people : [];
  return list.map((row) => ({
    ...row,
    birth_latitude: parseCoord(row.birth_latitude as unknown),
    birth_longitude: parseCoord(row.birth_longitude as unknown),
    death_latitude: parseCoord(row.death_latitude as unknown),
    death_longitude: parseCoord(row.death_longitude as unknown),
  }));
}

export interface PersonUpdateInput {
  first_name: string;
  last_name: string | null;
  gender: string;
  bio: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  birth_date_year_only: boolean;
  death_date_year_only: boolean;
  location_of_birth: string | null;
  location_of_death: string | null;
  birth_latitude: number | null;
  birth_longitude: number | null;
  death_latitude: number | null;
  death_longitude: number | null;
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

function appendCoord(fd: FormData, key: string, value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    fd.append(`person[${key}]`, '');
  } else {
    fd.append(`person[${key}]`, String(value));
  }
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
  p('birth_date_year_only', input.birth_date_year_only ? '1' : '0');
  p('death_date_year_only', input.death_date_year_only ? '1' : '0');
  p('location_of_birth', trimToNull(input.location_of_birth) ?? '');
  p('location_of_death', trimToNull(input.location_of_death) ?? '');
  appendCoord(fd, 'birth_latitude', input.birth_latitude);
  appendCoord(fd, 'birth_longitude', input.birth_longitude);
  appendCoord(fd, 'death_latitude', input.death_latitude);
  appendCoord(fd, 'death_longitude', input.death_longitude);
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
              birth_date_year_only: input.birth_date_year_only,
              death_date_year_only: input.death_date_year_only,
              location_of_birth: trimToNull(input.location_of_birth),
              location_of_death: trimToNull(input.location_of_death),
              birth_latitude: input.birth_latitude,
              birth_longitude: input.birth_longitude,
              death_latitude: input.death_latitude,
              death_longitude: input.death_longitude,
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
  const p = normalizePersonDetail(o.person);
  return {
    ...p,
    tagged_gallery_photos: Array.isArray(p.tagged_gallery_photos) ? p.tagged_gallery_photos : [],
  };
}
