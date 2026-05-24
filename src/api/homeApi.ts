import { API_BASE } from '../auth/authApi';
import { getStoredToken } from '../auth/storage';

export interface HomeStats {
  people_count: number;
  gallery_photos_count: number;
}

function authHeaders(): Headers {
  const headers = new Headers();
  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

function normalizeHomeStats(raw: unknown): HomeStats {
  const o = raw as Record<string, unknown>;
  return {
    people_count: Number(o.people_count) || 0,
    gallery_photos_count: Number(o.gallery_photos_count) || 0,
  };
}

export async function fetchHomeStats(): Promise<HomeStats> {
  const res = await fetch(`${API_BASE}/api/v1/home/stats`, {
    cache: 'no-store',
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
  const o = json as { stats?: unknown };
  if (!o.stats || typeof o.stats !== 'object') {
    throw new Error('Некорректный ответ сервера');
  }
  return normalizeHomeStats(o.stats);
}
