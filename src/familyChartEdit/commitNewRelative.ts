import type { FamilyChartData } from '../familyChartApi';

export type ChartDatum = {
  id?: string;
  data: Record<string, unknown>;
  rels?: Record<string, string[]>;
  _new_rel_data?: {
    rel_type: string;
    label: string;
    rel_id: string;
    other_parent_id?: string;
  };
  to_add?: unknown;
  unknown?: unknown;
};

export type EditTreeAddBridge = {
  exportData: () => FamilyChartData;
  addRelativeInstance: {
    is_active: boolean;
    onChange: ((updated_datum: ChartDatum, props: Record<string, unknown> | null) => void) | null;
    cleanUp: (data?: FamilyChartData) => FamilyChartData;
    onCancel: (() => void) | null;
  };
  store: {
    getDatum: (id: string) => ChartDatum | undefined;
    state: { one_level_rels: boolean };
  };
};

export function applyPersonNamesToChartDatum(
  datum: ChartDatum,
  firstName: string,
  lastName: string,
): void {
  const fn = firstName.trim();
  const ln = lastName.trim();
  datum.data['first name'] = fn || 'Unknown';
  if (ln) {
    datum.data['last name'] = ln;
  } else {
    delete datum.data['last name'];
  }
}

/** Подтверждает placeholder из режима add-relative или карточку to_add. */
export function commitChartPersonCreation(editTree: EditTreeAddBridge, chartNodeId: string): ChartDatum | null {
  const datum = editTree.store.getDatum(chartNodeId);
  if (!datum) {
    return null;
  }

  if (datum._new_rel_data) {
    editTree.addRelativeInstance.onChange?.(datum, {});
  }
  if (datum.to_add) {
    delete datum.to_add;
  }

  return datum;
}

/** Снимает режим добавления без отката main на якорную персону (в отличие от onCancel). */
export function deactivateAddRelativeMode(editTree: EditTreeAddBridge): void {
  const ar = editTree.addRelativeInstance;
  if (!ar.is_active) {
    return;
  }
  ar.cleanUp();
  editTree.store.state.one_level_rels = false;
  ar.is_active = false;
  ar.onChange = null;
  ar.onCancel = null;
}

export function relTypeLabel(relType: string): string {
  const labels: Record<string, string> = {
    father: 'Отец',
    mother: 'Мать',
    spouse: 'Супруг(а)',
    son: 'Сын',
    daughter: 'Дочь',
  };
  return labels[relType] ?? relType;
}
