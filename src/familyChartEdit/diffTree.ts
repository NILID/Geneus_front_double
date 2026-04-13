import type { FamilyChartData } from '../familyChartApi';

export function diffPersonIds(
  previous: FamilyChartData | null,
  next: FamilyChartData,
): { added: string[]; removed: string[] } {
  const prevIds = new Set(previous?.map((p) => p.id) ?? []);
  const nextIds = new Set(next.map((p) => p.id));
  const added = Array.from(nextIds).filter((id) => !prevIds.has(id));
  const removed = Array.from(prevIds).filter((id) => !nextIds.has(id));
  return { added, removed };
}
