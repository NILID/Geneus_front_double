import { resolveRailsBlobUrl } from './api/assetUrls';
import { API_BASE } from './auth/authApi';
import { getStoredToken } from './auth/storage';
import { formatFamilyChartYearLine } from './lib/genealogyDateFormat';

/**
 * Shape expected by family-chart (see library data format).
 * Defined locally because `family-chart`'s `Data` / `Datum` re-exports resolve as namespaces under this TS setup.
 */
export interface FamilyChartPerson {
  id: string;
  /** Database primary key; same identifiers work in `/person/:id` and the people API. */
  person_id?: number;
  data: {
    gender: 'M' | 'F';
    [key: string]: unknown;
  };
  rels: {
    parents: string[];
    spouses: string[];
    children: string[];
  };
}

export type FamilyChartData = FamilyChartPerson[];

export interface UpdateTreePayload {
  nodes: FamilyChartData;
  removed_ids: string[];
}

function defaultTreeUrl(service: 'family_chart' | 'update_tree'): string {
  const base = API_BASE.replace(/\/$/, '');
  return `${base}/api/v1/people/${service}`;
}

/** До миграции в API запросы шли на `/people/...` — подменяем, если env или закэшированная сборка ещё такие. */
function coerceLegacyTreeUrl(url: string, service: 'family_chart' | 'update_tree'): string {
  const legacyPath = `/people/${service}`;
  const modernPath = `/api/v1/people/${service}`;
  if (url.includes(modernPath)) {
    return url;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url);
      if (u.pathname === legacyPath) {
        u.pathname = modernPath;
        return u.toString();
      }
    } catch {
      /* ignore */
    }
    return url;
  }
  if (url === legacyPath || url.startsWith(`${legacyPath}?`)) {
    return url.replace(legacyPath, modernPath);
  }
  return url;
}

function envOrDefaultTreeUrl(envKey: 'REACT_APP_FAMILY_CHART_URL' | 'REACT_APP_UPDATE_TREE_URL', service: 'family_chart' | 'update_tree'): string {
  const raw = process.env[envKey];
  const fallback = defaultTreeUrl(service);
  const fromEnv = typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : null;
  return coerceLegacyTreeUrl(fromEnv ?? fallback, service);
}

/** URL для GET древа (учитывает env и устаревший `/people/family_chart`). */
export function getFamilyChartUrl(): string {
  return envOrDefaultTreeUrl('REACT_APP_FAMILY_CHART_URL', 'family_chart');
}

/** URL для POST сохранения древа. */
export function getUpdateTreeUrl(): string {
  return envOrDefaultTreeUrl('REACT_APP_UPDATE_TREE_URL', 'update_tree');
}

function rewriteFamilyChartAvatarUrls(data: FamilyChartData): FamilyChartData {
  return data.map((node) => {
    const raw = node.data?.avatar;
    if (typeof raw !== 'string' || raw === '') {
      return node;
    }
    const fixed = resolveRailsBlobUrl(raw);
    if (!fixed || fixed === raw) {
      return node;
    }
    return {
      ...node,
      data: { ...node.data, avatar: fixed },
    };
  });
}

export function normalizeFamilyChartPayload(json: unknown): FamilyChartData {
  let data: FamilyChartData;
  if (Array.isArray(json)) {
    data = json as FamilyChartData;
  } else if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.family_chart)) {
      data = o.family_chart as FamilyChartData;
    } else if (Array.isArray(o.data)) {
      data = o.data as FamilyChartData;
    } else if (Array.isArray(o.people)) {
      data = o.people as FamilyChartData;
    } else {
      throw new Error(
        'Family chart response must be a JSON array of nodes, or an object with family_chart, data, or people array.',
      );
    }
  } else {
    throw new Error(
      'Family chart response must be a JSON array of nodes, or an object with family_chart, data, or people array.',
    );
  }
  return rewriteFamilyChartAvatarUrls(data);
}

/** Варианты для выбора персон (id — ключ в БД для API персон). */
export interface ChartPersonOption {
  id: number;
  label: string;
  /** Только ФИО для поиска в autocomplete (без годов и скобок). */
  searchText: string;
  avatarUrl: string | null;
  initials: string;
}

function chartNodePersonId(node: FamilyChartPerson): number | null {
  const numericFromId =
    typeof node.id === 'string' && /^\d+$/.test(node.id) ? Number(node.id) : NaN;
  const rawId = node.person_id ?? (Number.isFinite(numericFromId) ? numericFromId : NaN);
  if (!Number.isFinite(rawId) || rawId < 1) {
    return null;
  }
  return rawId;
}

function chartNodeNameParts(node: FamilyChartPerson): { first: string; last: string } {
  const d = node.data as Record<string, unknown> | undefined;
  const first = typeof d?.['first name'] === 'string' ? d['first name'].trim() : '';
  const last = typeof d?.['last name'] === 'string' ? d['last name'].trim() : '';
  return { first, last };
}

export function chartPersonInitials(first: string, last: string): string {
  const fn = first.trim();
  const ln = last.trim();
  if (fn && ln) {
    return (fn[0] + ln[0]).toUpperCase();
  }
  if (fn.length >= 2) {
    return fn.slice(0, 2).toUpperCase();
  }
  return fn.slice(0, 1).toUpperCase() || '?';
}

function chartNodeAvatarUrl(d: Record<string, unknown>): string | null {
  const raw = d.avatar;
  if (typeof raw !== 'string' || raw.trim() === '') {
    return null;
  }
  return raw.trim();
}

/** Строка для фильтрации по вводу: варианты порядка имени и фамилии. */
export function chartPersonSearchText(first: string, last: string, id: number): string {
  const parts: string[] = [];
  const push = (s: string) => {
    const t = s.trim();
    if (t) {
      parts.push(t);
    }
  };
  push(last);
  push(first);
  push(`${last} ${first}`);
  push(`${first} ${last}`);
  const unique = Array.from(new Set(parts));
  return unique.length > 0 ? unique.join(' ') : `id ${id}`;
}

function collectChartPersonOptions(
  chart: FamilyChartData,
  buildLabel: (first: string, last: string, id: number, data: Record<string, unknown>) => string,
): ChartPersonOption[] {
  const byId = new Map<number, ChartPersonOption>();
  for (const node of chart) {
    const rawId = chartNodePersonId(node);
    if (rawId == null) {
      continue;
    }
    const { first, last } = chartNodeNameParts(node);
    const d = (node.data ?? {}) as Record<string, unknown>;
    const label = buildLabel(first, last, rawId, d);
    byId.set(rawId, {
      id: rawId,
      label,
      searchText: chartPersonSearchText(first, last, rawId),
      avatarUrl: chartNodeAvatarUrl(d),
      initials: chartPersonInitials(first, last),
    });
  }
  return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label, 'ru'));
}

/** Короткая подпись «имя фамилия» для списков. */
export function chartPeopleAsTagOptions(chart: FamilyChartData): ChartPersonOption[] {
  return collectChartPersonOptions(chart, (first, last, rawId) => {
    return [first, last].filter(Boolean).join(' ').trim() || `ID ${rawId}`;
  });
}

/**
 * Подписи для выбора персоны: фамилия, имя и строка лет как на карточках древа
 * ({@link formatFamilyChartYearLine}).
 */
export function chartPersonLinkSelectOptions(chart: FamilyChartData): ChartPersonOption[] {
  return collectChartPersonOptions(chart, (first, last, rawId, d) => {
    const yearLine = formatFamilyChartYearLine(d);
    const name = [last, first].filter(Boolean).join(' ').trim() || `ID ${rawId}`;
    return yearLine ? `${name} (${yearLine})` : name;
  });
}

function authorizedInit(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers ?? undefined);
  headers.set('Accept', 'application/json');
  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return { ...init, headers, cache: 'no-store' };
}

export async function fetchFamilyChart(): Promise<FamilyChartData> {
  const res = await fetch(getFamilyChartUrl(), authorizedInit());
  if (!res.ok) {
    throw new Error(`Не удалось получить данные о семейном древе: ${res.status} ${res.statusText}`);
  }
  const json: unknown = await res.json();
  return normalizeFamilyChartPayload(json);
}

export async function saveFamilyTree(payload: UpdateTreePayload): Promise<FamilyChartData> {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(getUpdateTreeUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Update tree request failed: ${res.status} ${res.statusText}`);
  }
  const json: unknown = await res.json();
  if (json && typeof json === 'object' && Array.isArray((json as Record<string, unknown>).nodes)) {
    return rewriteFamilyChartAvatarUrls((json as { nodes: FamilyChartData }).nodes);
  }
  return normalizeFamilyChartPayload(json);
}
