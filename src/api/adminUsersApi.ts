import { API_BASE } from '../auth/authApi';
import { getStoredToken } from '../auth/storage';
import { parseUserRole, type UserRole } from '../auth/roles';

export type AdminUserRow = {
  id: number;
  email: string;
  role: UserRole;
  person_id: number | null;
  last_sign_in_at: string | null;
};

function headers(): Headers {
  const h = new Headers();
  h.set('Accept', 'application/json');
  h.set('Content-Type', 'application/json');
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
      if (typeof o.message === 'string') {
        return o.message;
      }
    }
  } catch {
    /* ignore */
  }
  return `${res.status} ${res.statusText}`;
}

function parseAdminUserRow(row: unknown): AdminUserRow {
  if (!row || typeof row !== 'object') {
    throw new Error('Некорректный ответ сервера');
  }
  const r = row as Record<string, unknown>;
  const pid = r.person_id;
  let person_id: number | null = null;
  if (pid !== null && pid !== undefined && pid !== '') {
    const n = Number(pid);
    person_id = Number.isFinite(n) && n > 0 ? n : null;
  }
  const rawLast = r.last_sign_in_at;
  const last_sign_in_at =
    typeof rawLast === 'string' && rawLast.trim() !== '' ? rawLast : null;
  return {
    id: Number(r.id),
    email: String(r.email),
    role: parseUserRole(r.role),
    person_id,
    last_sign_in_at,
  };
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const res = await fetch(`${API_BASE}/api/v1/admin/users`, { headers: headers() });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const data: unknown = await res.json();
  if (!data || typeof data !== 'object') {
    throw new Error('Некорректный ответ сервера');
  }
  const users = (data as { users?: unknown }).users;
  if (!Array.isArray(users)) {
    throw new Error('Некорректный ответ сервера');
  }
  return users.map(parseAdminUserRow);
}

export async function patchAdminUserRole(userId: number, role: UserRole): Promise<AdminUserRow> {
  const res = await fetch(`${API_BASE}/api/v1/admin/users/${userId}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ user: { role } }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const data: unknown = await res.json();
  if (!data || typeof data !== 'object') {
    throw new Error('Некорректный ответ сервера');
  }
  const u = (data as { user?: unknown }).user;
  return parseAdminUserRow(u);
}
