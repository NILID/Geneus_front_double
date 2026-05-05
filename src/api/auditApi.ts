import { API_BASE } from '../auth/authApi';
import { getStoredToken } from '../auth/storage';

export interface AuditRow {
  id: number;
  action: string;
  auditable_type: string;
  auditable_id: number;
  user_id: number | null;
  user_email: string | null;
  comment: string | null;
  audited_changes: Record<string, unknown>;
  version: number;
  remote_address: string | null;
  created_at: string;
}

export interface AuditsMeta {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface AuditsResponse {
  audits: AuditRow[];
  meta: AuditsMeta;
}

export interface AuditFilterOptions {
  actions: string[];
  auditable_types: string[];
  users: { id: number; email: string }[];
}

export interface AuditListParams {
  page?: number;
  perPage?: number;
  actionType?: string;
  userId?: number;
  auditableType?: string;
  auditableId?: number;
  q?: string;
  from?: string;
  to?: string;
}

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

function normalizeAuditRow(raw: unknown): AuditRow {
  const o = raw as Record<string, unknown>;
  const changes = o.audited_changes;
  let audited_changes: Record<string, unknown> = {};
  if (changes && typeof changes === 'object' && !Array.isArray(changes)) {
    audited_changes = changes as Record<string, unknown>;
  }
  const uid = o.user_id;
  return {
    id: Number(o.id),
    action: typeof o.action === 'string' ? o.action : '',
    auditable_type: typeof o.auditable_type === 'string' ? o.auditable_type : '',
    auditable_id: Number(o.auditable_id),
    user_id:
      uid === null || uid === undefined || uid === ''
        ? null
        : Number.isFinite(Number(uid))
          ? Number(uid)
          : null,
    user_email: typeof o.user_email === 'string' ? o.user_email : null,
    comment: typeof o.comment === 'string' ? o.comment : null,
    audited_changes,
    version: typeof o.version === 'number' ? o.version : Number(o.version) || 0,
    remote_address: typeof o.remote_address === 'string' ? o.remote_address : null,
    created_at: typeof o.created_at === 'string' ? o.created_at : '',
  };
}

export async function fetchAuditFilterOptions(): Promise<AuditFilterOptions> {
  const res = await fetch(`${API_BASE}/api/v1/audits/filter_options`, {
    headers: authHeaders(false),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const json: unknown = await res.json();
  const o = json as Record<string, unknown>;
  const actions = o.actions;
  const types = o.auditable_types;
  const users = o.users;
  return {
    actions: Array.isArray(actions) ? actions.filter((x): x is string => typeof x === 'string') : [],
    auditable_types: Array.isArray(types) ? types.filter((x): x is string => typeof x === 'string') : [],
    users: Array.isArray(users)
      ? users.map((u) => {
          const r = u as Record<string, unknown>;
          return { id: Number(r.id), email: String(r.email) };
        })
      : [],
  };
}

export async function fetchAudits(params: AuditListParams): Promise<AuditsResponse> {
  const sp = new URLSearchParams();
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 25;
  sp.set('page', String(page));
  sp.set('per_page', String(perPage));
  if (params.actionType) {
    sp.set('action_type', params.actionType);
  }
  if (params.userId != null && params.userId > 0) {
    sp.set('user_id', String(params.userId));
  }
  if (params.auditableType) {
    sp.set('auditable_type', params.auditableType);
  }
  if (params.auditableId != null && params.auditableId > 0) {
    sp.set('auditable_id', String(params.auditableId));
  }
  if (params.q?.trim()) {
    sp.set('q', params.q.trim());
  }
  if (params.from?.trim()) {
    sp.set('from', params.from.trim());
  }
  if (params.to?.trim()) {
    sp.set('to', params.to.trim());
  }

  const res = await fetch(`${API_BASE}/api/v1/audits?${sp.toString()}`, {
    headers: authHeaders(false),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  const json: unknown = await res.json();
  const o = json as Record<string, unknown>;
  const list = o.audits;
  const meta = o.meta as Record<string, unknown> | undefined;
  if (!Array.isArray(list) || !meta || typeof meta !== 'object') {
    throw new Error('Некорректный ответ сервера');
  }
  return {
    audits: list.map(normalizeAuditRow),
    meta: {
      page: Number(meta.page) || 1,
      per_page: Number(meta.per_page) || perPage,
      total_count: Number(meta.total_count) || 0,
      total_pages: Number(meta.total_pages) || 0,
    },
  };
}
