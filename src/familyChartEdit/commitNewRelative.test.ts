import {
  applyPersonNamesToChartDatum,
  commitChartPersonCreation,
  deactivateAddRelativeMode,
  relTypeLabel,
  type ChartDatum,
  type EditTreeAddBridge,
} from './commitNewRelative';

function mockEditTree(datum: ChartDatum): EditTreeAddBridge & { onChangeCalls: ChartDatum[] } {
  const onChangeCalls: ChartDatum[] = [];
  const storeData = [datum];
  return {
    onChangeCalls,
    exportData: () => storeData as never,
    addRelativeInstance: {
      is_active: true,
      onChange: (updated) => {
        onChangeCalls.push(updated);
        if (updated._new_rel_data) {
          delete updated._new_rel_data;
        }
      },
      cleanUp: (data) => (data ?? storeData) as never,
      onCancel: null,
    },
    store: {
      getDatum: (id) => storeData.find((d) => d.id === id),
      state: { one_level_rels: true },
    },
  };
}

describe('commitNewRelative', () => {
  it('applyPersonNamesToChartDatum sets names', () => {
    const datum: ChartDatum = { id: '1', data: { gender: 'M' } };
    applyPersonNamesToChartDatum(datum, 'Иван', 'Петров');
    expect(datum.data['first name']).toBe('Иван');
    expect(datum.data['last name']).toBe('Петров');
  });

  it('commitChartPersonCreation clears _new_rel_data via onChange', () => {
    const datum: ChartDatum = {
      id: 'new-1',
      data: { gender: 'M' },
      _new_rel_data: { rel_type: 'father', label: 'Отец', rel_id: 'anchor' },
    };
    const tree = mockEditTree(datum);
    const result = commitChartPersonCreation(tree, 'new-1');
    expect(result?._new_rel_data).toBeUndefined();
    expect(tree.onChangeCalls).toHaveLength(1);
  });

  it('deactivateAddRelativeMode resets add-relative state', () => {
    const datum: ChartDatum = { id: '1', data: { gender: 'F' } };
    const tree = mockEditTree(datum);
    deactivateAddRelativeMode(tree);
    expect(tree.addRelativeInstance.is_active).toBe(false);
    expect(tree.store.state.one_level_rels).toBe(false);
  });

  it('relTypeLabel returns Russian labels', () => {
    expect(relTypeLabel('son')).toBe('Сын');
  });
});
