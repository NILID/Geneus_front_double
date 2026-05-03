import { API_BASE } from '../auth/authApi';
import { getStoredToken } from '../auth/storage';

export interface Idea {
  id: number;
  user_id: number;
  author_email: string | null;
  body: string;
  created_at: string;
  comments_count: number;
}

export interface IdeaComment {
  id: number;
  user_id: number;
  author_email: string | null;
  body: string;
  created_at: string;
}

const MAX_BODY = 10_000;
const MAX_COMMENT_BODY = 5000;

export { MAX_BODY, MAX_COMMENT_BODY };

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
  const cc = o.comments_count;
  return {
    id: Number(o.id),
    user_id: Number(o.user_id),
    author_email: typeof o.author_email === 'string' ? o.author_email : null,
    body: typeof o.body === 'string' ? o.body : '',
    created_at: typeof o.created_at === 'string' ? o.created_at : '',
    comments_count: typeof cc === 'number' && !Number.isNaN(cc) ? cc : 0,
  };
}

function normalizeComment(raw: unknown): IdeaComment {
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

export async function fetchIdeaComments(ideaId: number): Promise<IdeaComment[]> {
  const res = await fetch(`${API_BASE}/api/v1/ideas/${ideaId}/comments`, {
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
  return list.map(normalizeComment);
}

export async function createIdeaComment(
  ideaId: number,
  body: string,
): Promise<{ comment: IdeaComment; comments_count: number }> {
  const res = await fetch(`${API_BASE}/api/v1/ideas/${ideaId}/comments`, {
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
  return { comment: normalizeComment(comment), comments_count: commentsCount };
}
