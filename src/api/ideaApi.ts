import { API_BASE } from '../auth/authApi';
import { getStoredToken } from '../auth/storage';

export interface Idea {
  id: number;
  user_id: number;
  author_email: string | null;
  body: string;
  created_at: string;
}

const MAX_BODY = 10_000;

export { MAX_BODY };

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

function normalizeIdea(raw: unknown): Idea {
  const o = raw as Record<string, unknown>;
  return {
    id: Number(o.id),
    user_id: Number(o.user_id),
    author_email: typeof o.author_email === 'string' ? o.author_email : null,
    body: typeof o.body === 'string' ? o.body : '',
    created_at: typeof o.created_at === 'string' ? o.created_at : '',
  };
}

export async function fetchIdeas(): Promise<Idea[]> {
  const res = await fetch(`${API_BASE}/api/v1/ideas`, {
    headers: authHeaders(false),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const json: unknown = await res.json();
  const list = (json as { ideas?: unknown[] }).ideas;
  if (!Array.isArray(list)) {
    throw new Error('Некорректный ответ сервера');
  }
  return list.map(normalizeIdea);
}

export async function createIdea(body: string): Promise<Idea> {
  const res = await fetch(`${API_BASE}/api/v1/ideas`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ idea: { body } }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const json: unknown = await res.json();
  const idea = (json as { idea?: unknown }).idea;
  if (!idea || typeof idea !== 'object') {
    throw new Error('Некорректный ответ сервера');
  }
  return normalizeIdea(idea);
}
