import { getStoredToken } from './auth/storage';

/**
 * Shape expected by family-chart (see library data format).
 * Defined locally because `family-chart`'s `Data` / `Datum` re-exports resolve as namespaces under this TS setup.
 */
export interface FamilyChartPerson {
  id: string;
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

/** Dev server proxies this to http://127.0.0.1:3001 (see package.json). Override with REACT_APP_FAMILY_CHART_URL. */
export const FAMILY_CHART_URL =
  process.env.REACT_APP_FAMILY_CHART_URL ?? '/people/family_chart';
export const UPDATE_TREE_URL = process.env.REACT_APP_UPDATE_TREE_URL ?? '/people/update_tree';

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
  const res = await fetch(FAMILY_CHART_URL, authorizedInit());
  if (!res.ok) {
    throw new Error(`Не удалось получить данные о семейном древе: ${res.status} ${res.statusText}`);
  }
  const json: unknown = await res.json();
  return normalizeFamilyChartPayload(json);
}

function getCsrfToken(): string | null {
  return document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content')
    ?.trim() ?? null;
}

export async function saveFamilyTree(payload: UpdateTreePayload): Promise<FamilyChartData> {
  const csrfToken = getCsrfToken();
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  const res = await fetch(UPDATE_TREE_URL, {
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
