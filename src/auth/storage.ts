const TOKEN_KEY = 'geneus_jwt';

export function getStoredToken(): string | null {
  try {
    const v = window.localStorage.getItem(TOKEN_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function readBearerFromResponse(res: Response): string | null {
  const raw = res.headers.get('Authorization') ?? res.headers.get('authorization');
  if (!raw) {
    return null;
  }
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
