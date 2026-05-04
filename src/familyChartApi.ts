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

export function normalizeFamilyChartPayload(json: unknown): FamilyChartData {
  if (Array.isArray(json)) {
    return json as FamilyChartData;
  }
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.family_chart)) {
      return o.family_chart as FamilyChartData;
    }
    if (Array.isArray(o.data)) {
      return o.data as FamilyChartData;
    }
    if (Array.isArray(o.people)) {
      return o.people as FamilyChartData;
    }
  }
  throw new Error(
    'Family chart response must be a JSON array of nodes, or an object with family_chart, data, or people array.',
  );
}

/** Варианты для выбора персон при отметке на фото (id — ключ в БД для API персон). */
export interface ChartPersonOption {
  id: number;
  label: string;
}

export function chartPeopleAsTagOptions(chart: FamilyChartData): ChartPersonOption[] {
  const byId = new Map<number, ChartPersonOption>();
  for (const node of chart) {
    const numericFromId =
      typeof node.id === 'string' && /^\d+$/.test(node.id) ? Number(node.id) : NaN;
    const rawId = node.person_id ?? (Number.isFinite(numericFromId) ? numericFromId : NaN);
    if (!Number.isFinite(rawId) || rawId < 1) {
      continue;
    }
    const first =
      typeof node.data?.['first name'] === 'string' ? node.data['first name'].trim() : '';
    const last =
      typeof node.data?.['last name'] === 'string' ? node.data['last name'].trim() : '';
    const label = [first, last].filter(Boolean).join(' ').trim() || `ID ${rawId}`;
    byId.set(rawId, { id: rawId, label });
  }
  return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label, 'ru'));
}

/**
 * Подписи для привязки учётки к персоне: фамилия, имя и строка лет как на карточках древа
 * ({@link formatFamilyChartYearLine}).
 */
export function chartPersonLinkSelectOptions(chart: FamilyChartData): ChartPersonOption[] {
  const byId = new Map<number, ChartPersonOption>();
  for (const node of chart) {
    const numericFromId =
      typeof node.id === 'string' && /^\d+$/.test(node.id) ? Number(node.id) : NaN;
    const rawId = node.person_id ?? (Number.isFinite(numericFromId) ? numericFromId : NaN);
    if (!Number.isFinite(rawId) || rawId < 1) {
      continue;
    }
    const d = node.data as Record<string, unknown>;
    const first = typeof d['first name'] === 'string' ? d['first name'].trim() : '';
    const last = typeof d['last name'] === 'string' ? d['last name'].trim() : '';
    const yearLine = formatFamilyChartYearLine(d);
    const name = [last, first].filter(Boolean).join(' ').trim() || `ID ${rawId}`;
    const label = yearLine ? `${name} (${yearLine})` : name;
    byId.set(rawId, { id: rawId, label });
  }
  return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label, 'ru'));
}

function authorizedInit(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers ?? undefined);
  headers.set('Accept', 'application/json');
  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return { ...init, headers };
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
  });
  if (!res.ok) {
    throw new Error(`Update tree request failed: ${res.status} ${res.statusText}`);
  }
  const json: unknown = await res.json();
  if (json && typeof json === 'object' && Array.isArray((json as Record<string, unknown>).nodes)) {
    return (json as { nodes: FamilyChartData }).nodes;
  }
  return normalizeFamilyChartPayload(json);
}
