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

/** Dev server proxies this to http://127.0.0.1:3001 (see package.json). Override with REACT_APP_FAMILY_CHART_URL. */
export const FAMILY_CHART_URL =
  process.env.REACT_APP_FAMILY_CHART_URL ?? '/people/family_chart';

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

export async function fetchFamilyChart(): Promise<FamilyChartData> {
  const res = await fetch(FAMILY_CHART_URL);
  if (!res.ok) {
    throw new Error(`Family chart request failed: ${res.status} ${res.statusText}`);
  }
  const json: unknown = await res.json();
  return normalizeFamilyChartPayload(json);
}
