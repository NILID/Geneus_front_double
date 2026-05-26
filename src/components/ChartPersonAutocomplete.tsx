import React, { useEffect, useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import type { ChartPersonOption } from '../familyChartApi';
import { filterChartPersonAutocompleteOptions } from '../lib/chartPersonFilter';
import { ChartPersonAvatar as PersonOptionAvatar } from './ChartPersonAvatar';

function SelectedPersonInputAvatar({ person }: { person: ChartPersonOption }) {
  return (
    <InputAdornment position="start" sx={{ ml: 0.5, mr: 0.25 }}>
      <PersonOptionAvatar
        avatarUrl={person.avatarUrl}
        initials={person.initials}
        size="input"
      />
    </InputAdornment>
  );
}

function ChartPersonOptionRow({
  option,
  avatarSize = 'list',
}: {
  option: ChartPersonOption;
  avatarSize?: 'list' | 'input';
}) {
  return (
    <Box
      component="span"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        minWidth: 0,
        width: '100%',
      }}
    >
      <PersonOptionAvatar
        avatarUrl={option.avatarUrl}
        initials={option.initials}
        size={avatarSize}
      />
      <Typography
        component="span"
        variant="body2"
        sx={{
          minWidth: 0,
          flex: '1 1 auto',
          lineHeight: 1.35,
          whiteSpace: 'normal',
        }}
      >
        {option.label}
      </Typography>
    </Box>
  );
}

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
            <ChartPersonOptionRow option={option} />
          </li>
        );
      }}
      noOptionsText={
        inputValue.trim() ? 'Ничего не найдено' : 'Введите имя или фамилию'
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          autoFocus={autoFocus}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <>
                  {value ? (
                    <SelectedPersonInputAvatar person={value} />
                  ) : null}
                  {params.slotProps.input.startAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
