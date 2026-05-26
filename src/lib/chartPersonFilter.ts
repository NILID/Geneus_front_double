import { createFilterOptions } from '@mui/material/Autocomplete';

import type { ChartPersonOption } from '../familyChartApi';

/** Подстрока в имени/фамилии (без строки лет в label). */
const matchPersonName = createFilterOptions<ChartPersonOption>({
  ignoreCase: true,
  trim: true,
  matchFrom: 'any',
  limit: 100,
  stringify: (option) => option.searchText,
});

export function filterChartPersonAutocompleteOptions(
  options: ChartPersonOption[],
  state: Parameters<typeof matchPersonName>[1],
): ChartPersonOption[] {
  if (!state.inputValue.trim()) {
    return [];
  }
  return matchPersonName(options, state);
}
