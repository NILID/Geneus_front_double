import { API_BASE } from '../auth/authApi';
import { getStoredToken } from '../auth/storage';

export type AdminDigestCounts = {
  birthdays: number;
  new_people: number;
  updated_people: number;
  photos: number;
  photo_tags: number;
  facts: number;
};

export type AdminDigestSendResult = {
  sent: number;
  recipients: string[];
  period: { from: string; to: string };
  counts: AdminDigestCounts;
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

function parseCounts(raw: unknown): AdminDigestCounts {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    birthdays: Number(o.birthdays) || 0,
    new_people: Number(o.new_people) || 0,
    updated_people: Number(o.updated_people) || 0,
    photos: Number(o.photos) || 0,
    photo_tags: Number(o.photo_tags) || 0,
    facts: Number(o.facts) || 0,
  };
}

export async function sendAdminDigest(): Promise<AdminDigestSendResult> {
  const res = await fetch(`${API_BASE}/api/v1/admin/digest`, {
    method: 'POST',
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const data: unknown = await res.json();
  if (!data || typeof data !== 'object') {
    throw new Error('Некорректный ответ сервера');
  }
  const o = data as Record<string, unknown>;
  const recipients = Array.isArray(o.recipients)
    ? o.recipients.filter((x): x is string => typeof x === 'string')
    : [];
  const periodRaw = o.period && typeof o.period === 'object' ? (o.period as Record<string, unknown>) : {};
  return {
    sent: Number(o.sent) || 0,
    recipients,
    period: {
      from: typeof periodRaw.from === 'string' ? periodRaw.from : '',
      to: typeof periodRaw.to === 'string' ? periodRaw.to : '',
    },
    counts: parseCounts(o.counts),
  };
}
