import {
  chartPersonLinkSelectOptions,
  chartPersonSearchText,
  type ChartPersonOption,
  type FamilyChartData,
} from './familyChartApi';
import { filterChartPersonAutocompleteOptions } from './lib/chartPersonFilter';

const sampleChart: FamilyChartData = [
  {
    id: '1',
    person_id: 1,
    data: { gender: 'M', 'first name': 'Иван', 'last name': 'Петров', birthday: '1920' },
    rels: { parents: [], spouses: [], children: [] },
  },
  {
    id: '2',
    person_id: 2,
    data: { gender: 'F', 'first name': 'Мария', 'last name': 'Петрова' },
    rels: { parents: [], spouses: [], children: [] },
  },
  {
    id: '3',
    person_id: 3,
    data: { gender: 'M', 'first name': 'Иван', 'last name': 'Петров' },
    rels: { parents: [], spouses: [], children: [] },
  },
];

describe('chartPersonSearchText', () => {
  it('includes first and last in both orders', () => {
    const text = chartPersonSearchText('Иван', 'Петров', 1);
    expect(text).toContain('Петров');
    expect(text).toContain('Иван');
    expect(text).toContain('Петров Иван');
    expect(text).toContain('Иван Петров');
  });
});

describe('chartPersonLinkSelectOptions', () => {
  it('deduplicates by person id', () => {
    const opts = chartPersonLinkSelectOptions([
      ...sampleChart,
      { ...sampleChart[0], id: 'dup' },
    ]);
    expect(opts.filter((o) => o.id === 1)).toHaveLength(1);
  });

  it('gives distinct options for same name different ids', () => {
    const opts = chartPersonLinkSelectOptions(sampleChart);
    const ivans = opts.filter((o) => o.searchText.includes('Иван'));
    expect(ivans.length).toBeGreaterThanOrEqual(2);
    expect(new Set(ivans.map((o) => o.id)).size).toBe(ivans.length);
  });
});

describe('filterChartPersonAutocompleteOptions', () => {
  const opts = chartPersonLinkSelectOptions(sampleChart);

  it('returns nothing when input is empty', () => {
    expect(
      filterChartPersonAutocompleteOptions(opts, {
        inputValue: '',
        getOptionLabel: (o: ChartPersonOption) => o.searchText,
      }),
    ).toEqual([]);
  });

  it('matches surname substring only in searchText', () => {
    const filtered = filterChartPersonAutocompleteOptions(opts, {
      inputValue: 'Петрова',
      getOptionLabel: (o: ChartPersonOption) => o.searchText,
    });
    expect(filtered.every((o) => o.searchText.toLowerCase().includes('петрова'))).toBe(true);
    expect(filtered.some((o) => o.id === 2)).toBe(true);
    expect(filtered.some((o) => o.id === 1)).toBe(false);
  });

  it('does not match year digits in label when not in searchText', () => {
    const filtered = filterChartPersonAutocompleteOptions(opts, {
      inputValue: '1920',
      getOptionLabel: (o: ChartPersonOption) => o.searchText,
    });
    expect(filtered).toEqual([]);
  });
});
