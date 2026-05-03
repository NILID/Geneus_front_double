import { API_BASE } from '../auth/authApi';
import { getStoredToken } from '../auth/storage';

export interface PersonFact {
  id: number;
  user_id: number;
  author_email: string | null;
  body: string;
  created_at: string;
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

async function parseError(res: Response): Promise<string> {
  let msg = `${res.status} ${res.statusText}`;
  try {
    const body: unknown = await res.json();
    if (body && typeof body === 'object') {
      const o = body as { error?: string; errors?: unknown };
      if (typeof o.error === 'string') {
        msg = o.error;
      } else if (Array.isArray(o.errors) && o.errors.length > 0) {
        msg = o.errors.map(String).join(' ');
      }
    }
  } catch {
    /* ignore */
  }
  return msg;
}

export async function fetchPersonFacts(personId: string): Promise<PersonFact[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/people/${encodeURIComponent(personId)}/facts`,
    { headers: authHeaders() },
  );
  if (res.status === 404) {
    throw new Error('Персона не найдена');
  }
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const json: unknown = await res.json();
  const o = json as { person_facts?: PersonFact[] };
  return Array.isArray(o.person_facts) ? o.person_facts : [];
}

export async function createPersonFact(personId: string, body: string): Promise<PersonFact> {
  const h = authHeaders();
  h.set('Content-Type', 'application/json');
  const res = await fetch(
    `${API_BASE}/api/v1/people/${encodeURIComponent(personId)}/facts`,
    {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ person_fact: { body } }),
    },
  );
  if (res.status === 404) {
    throw new Error('Персона не найдена');
  }
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const json: unknown = await res.json();
  const o = json as { person_fact?: PersonFact };
  if (!o.person_fact) {
    throw new Error('Не удалось сохранить факт');
  }
  return o.person_fact;
}
