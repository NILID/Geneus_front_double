import { getStoredToken, readBearerFromResponse, setStoredToken } from './storage';

/** Same-origin default (CRA proxy → Rails). Override with e.g. http://localhost:3001 */
export const API_BASE =
  (process.env.REACT_APP_API_BASE_URL ?? '').replace(/\/$/, '') || '';

export interface AuthUser {
  id: number;
  email: string;
  /** Персона древа, с которой связана учётная запись (если задана). */
  person_id: number | null;
}

function parseAuthUserPayload(data: unknown): AuthUser {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid user payload');
  }
  const o = data as Record<string, unknown>;
  const pid = o.person_id;
  let person_id: number | null = null;
  if (pid !== null && pid !== undefined && pid !== '') {
    const n = Number(pid);
    person_id = Number.isFinite(n) && n > 0 ? n : null;
  }
  return { id: Number(o.id), email: String(o.email), person_id };
}

function buildHeaders(includeJsonBody: boolean, withAuth: boolean): Headers {
  const h = new Headers();
  h.set('Accept', 'application/json');
  if (includeJsonBody) {
    h.set('Content-Type', 'application/json');
  }
  if (withAuth) {
    const t = getStoredToken();
    if (t) {
      h.set('Authorization', `Bearer ${t}`);
    }
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

export async function loginRequest(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: buildHeaders(true, false),
    body: JSON.stringify({ user: { email, password } }),
  });
  const token = readBearerFromResponse(res);
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  if (!token) {
    throw new Error('Login succeeded but no JWT was returned (check CORS expose Authorization).');
  }
  setStoredToken(token);
  const data: unknown = await res.json();
  return parseAuthUserPayload(data);
}

export async function logoutRequest(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: 'DELETE',
    headers: buildHeaders(false, true),
  });
  setStoredToken(null);
  if (!res.ok && res.status !== 204) {
    throw new Error(await parseErrorMessage(res));
  }
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: buildHeaders(false, true),
  });
  if (res.status === 401) {
    setStoredToken(null);
    return null;
  }
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const data: unknown = await res.json();
  return parseAuthUserPayload(data);
}

export async function updateCurrentUserProfile(updates: {
  person_id: number | null;
}): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    method: 'PATCH',
    headers: buildHeaders(true, true),
    body: JSON.stringify({ user: { person_id: updates.person_id } }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const data: unknown = await res.json();
  return parseAuthUserPayload(data);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/auth/password`, {
    method: 'POST',
    headers: buildHeaders(true, false),
    body: JSON.stringify({ user: { email } }),
  });
  if (!res.ok && res.status !== 202 && res.status !== 204) {
    throw new Error(await parseErrorMessage(res));
  }
}

export async function resetPasswordRequest(
  resetPasswordToken: string,
  password: string,
  passwordConfirmation: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/auth/password`, {
    method: 'PATCH',
    headers: buildHeaders(true, false),
    body: JSON.stringify({
      user: {
        reset_password_token: resetPasswordToken,
        password,
        password_confirmation: passwordConfirmation,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
}

export async function sendInvitationRequest(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/auth/invitations`, {
    method: 'POST',
    headers: buildHeaders(true, true),
    body: JSON.stringify({ user: { email: email.trim() } }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
}

export interface InvitationLinkPayload {
  email: string;
  invitation_url: string;
  invitation_text: string;
  /** ISO8601, если на сервере задан срок действия приглашения */
  invitation_expires_at?: string;
}

export async function createInvitationLinkRequest(email: string): Promise<InvitationLinkPayload> {
  const res = await fetch(`${API_BASE}/api/v1/auth/invitations/link`, {
    method: 'POST',
    headers: buildHeaders(true, true),
    body: JSON.stringify({ user: { email: email.trim() } }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const data: unknown = await res.json();
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid invitation link payload');
  }
  const o = data as Record<string, unknown>;
  const exp = o.invitation_expires_at;
  return {
    email: String(o.email),
    invitation_url: String(o.invitation_url),
    invitation_text: String(o.invitation_text),
    invitation_expires_at:
      exp !== null && exp !== undefined && String(exp).length > 0 ? String(exp) : undefined,
  };
}

export async function acceptInvitationRequest(
  invitationToken: string,
  password: string,
  passwordConfirmation: string,
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/v1/auth/invitations`, {
    method: 'PATCH',
    headers: buildHeaders(true, false),
    body: JSON.stringify({
      user: {
        invitation_token: invitationToken,
        password,
        password_confirmation: passwordConfirmation,
      },
    }),
  });
  const token = readBearerFromResponse(res);
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  if (!token) {
    throw new Error('Не удалось получить токен после принятия приглашения.');
  }
  setStoredToken(token);
  const data: unknown = await res.json();
  return parseAuthUserPayload(data);
}
