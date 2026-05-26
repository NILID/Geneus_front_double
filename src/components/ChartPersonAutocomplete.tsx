import React, { useEffect, useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';

import type { ChartPersonOption } from '../familyChartApi';
import { filterChartPersonAutocompleteOptions } from '../lib/chartPersonFilter';

export function ChartPersonAutocomplete({
  options,
  value,
  onChange,
  excludeIds = [],
  disabled,
  label = 'Персона',
  autoFocus,
  instanceKey,
}: {
  options: ChartPersonOption[];
  value: ChartPersonOption | null;
  onChange: (person: ChartPersonOption | null) => void;
  /** Не показывать в списке (уже отмечены на фото). */
  excludeIds?: number[];
  disabled?: boolean;
  label?: string;
  autoFocus?: boolean;
  /** Сброс поля при новом открытии диалога. */
  instanceKey?: string | number;
}) {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');

  const availableOptions = useMemo(() => {
    if (excludeIds.length === 0) {
      return options;
    }
    const excluded = new Set(excludeIds);
    return options.filter((o) => !excluded.has(o.id));
  }, [options, excludeIds]);

  useEffect(() => {
    setInputValue(value?.label ?? '');
  }, [instanceKey, value?.id, value?.label]);

  return (
    <Autocomplete
      key={instanceKey != null ? String(instanceKey) : undefined}
      options={availableOptions}
      filterOptions={filterChartPersonAutocompleteOptions}
      getOptionLabel={(o) => o.label}
      getOptionKey={(o) => String(o.id)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      value={value}
      onChange={(_, v) => onChange(v)}
      inputValue={inputValue}
      onInputChange={(_, newInput, reason) => {
        if (reason === 'reset') {
          setInputValue(value?.label ?? '');
          return;
        }
        setInputValue(newInput);
        if (reason === 'clear') {
          onChange(null);
        }
      }}
      openOnFocus={false}
      autoHighlight
      blurOnSelect
      clearOnBlur={false}
      disabled={disabled}
      slotProps={{
        popper: {
          sx: { zIndex: theme.zIndex.modal + 2 },
        },
      }}
      renderOption={(props, option) => {
        const { key: _ignored, ...liProps } = props;
        return (
          <li {...liProps} key={option.id}>
            {option.label}
          </li>
        );
      }}
      noOptionsText={
        inputValue.trim() ? 'Ничего не найдено' : 'Введите имя или фамилию'
      }
      renderInput={(params) => (
        <TextField {...params} label={label} autoFocus={autoFocus} />
      )}
    />
  );
}
