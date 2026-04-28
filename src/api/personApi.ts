import { API_BASE } from '../auth/authApi';
import { getStoredToken } from '../auth/storage';

export interface PersonSummary {
  id: number;
  chart_external_id: string;
  name: string;
}

export interface PersonDetail {
  id: number;
  chart_id: string | null;
  chart_external_id: string;
  name: string;
  first_name: string;
  last_name: string | null;
  gender: string;
  bio: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  location_of_birth: string | null;
  location_of_death: string | null;
  parents: PersonSummary[];
  partners: PersonSummary[];
  children: PersonSummary[];
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

export async function fetchPerson(personId: string): Promise<PersonDetail> {
  const res = await fetch(
    `${API_BASE}/api/v1/people/${encodeURIComponent(personId)}`,
    { headers: authHeaders() },
  );
  if (res.status === 404) {
    throw new Error('Person not found');
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
    throw new Error('Invalid person response');
  }
  return o.person;
}
