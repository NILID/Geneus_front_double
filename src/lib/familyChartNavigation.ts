import type { FamilyChartData } from '../familyChartApi';
import type { PersonDetail } from '../api/personApi';

/** Ссылка на `/tree` с параметром, чтобы древо открылось от этой персоны (`updateMainId`). */
export function buildFamilyTreeHref(person: Pick<PersonDetail, 'id' | 'chart_id'>): string {
  const q = new URLSearchParams();
  if (person.chart_id) {
    q.set('main', person.chart_id);
  } else {
    q.set('person', String(person.id));
  }
  return `/tree?${q.toString()}`;
}

export function pickDefaultMainNodeId(data: FamilyChartData): string {
  if (data.length === 0) {
    return '1';
  }
  const legacy = data.find((n) => n.id === '1');
  if (legacy) {
    return '1';
  }
  return data[0].id;
}

/** Первый узел в массиве данных древа (как в JSON с сервера). */
export function pickFirstChartNodeId(data: FamilyChartData): string {
  if (data.length === 0) {
    return '1';
  }
  return data[0].id;
}

export type ResolveFamilyTreeMainNodeResult = {
  mainNodeId: string;
  /** Переход с `?person=…`, персона не найдена в графе. */
  missingPersonInTree: boolean;
  /** Учётка привязана к персоне, которой нет в текущем графе. */
  missingLinkedPersonInTree: boolean;
};

/**
 * Приоритет корня: валидный `main` из URL → `person` из URL → персона учётки (`linkedPersonId`) → первый узел в JSON.
 *
 * `main` — id узла в данных family-chart; `person` — числовой id персоны в БД (совпадает с `person_id` у узла).
 */
export function resolveFamilyTreeMainNode(
  data: FamilyChartData,
  mainParam: string | null,
  personParam: string | null,
  linkedPersonId: number | null | undefined,
): ResolveFamilyTreeMainNodeResult {
  if (data.length === 0) {
    return { mainNodeId: '1', missingPersonInTree: false, missingLinkedPersonInTree: false };
  }

  if (mainParam && data.some((n) => n.id === mainParam)) {
    return { mainNodeId: mainParam, missingPersonInTree: false, missingLinkedPersonInTree: false };
  }

  if (personParam) {
    const found = data.find((n) => {
      if (n.person_id == null) {
        return false;
      }
      return (
        String(n.person_id) === personParam ||
        (Number.isFinite(Number(personParam)) && n.person_id === Number(personParam))
      );
    });
    if (found) {
      return { mainNodeId: found.id, missingPersonInTree: false, missingLinkedPersonInTree: false };
    }
    return {
      mainNodeId: pickFirstChartNodeId(data),
      missingPersonInTree: true,
      missingLinkedPersonInTree: false,
    };
  }

  if (linkedPersonId != null && linkedPersonId > 0) {
    const found = data.find(
      (n) => n.person_id != null && Number(n.person_id) === Number(linkedPersonId),
    );
    if (found) {
      return { mainNodeId: found.id, missingPersonInTree: false, missingLinkedPersonInTree: false };
    }
    return {
      mainNodeId: pickFirstChartNodeId(data),
      missingPersonInTree: false,
      missingLinkedPersonInTree: true,
    };
  }

  return {
    mainNodeId: pickFirstChartNodeId(data),
    missingPersonInTree: false,
    missingLinkedPersonInTree: false,
  };
}
