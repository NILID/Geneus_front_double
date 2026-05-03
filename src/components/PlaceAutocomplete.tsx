import React, { useEffect, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import type { PlaceSuggestion } from '../lib/osmGeocode';
import { searchPhotonPlaces } from '../lib/osmGeocode';

export interface PlaceAutocompleteProps {
  fieldLabel: string;
  helperText?: string;
  /** Выбранный пункт с координатами (после выбора из списка или загрузки с сервера). */
  place: PlaceSuggestion | null;
  /** Текст в поле (ввод или подпись выбранного пункта). */
  inputValue: string;
  onPlaceChange: (place: PlaceSuggestion | null, input: string) => void;
  disabled?: boolean;
}

export function PlaceAutocomplete({
  fieldLabel,
  helperText,
  place,
  inputValue,
  onPlaceChange,
  disabled,
}: PlaceAutocompleteProps) {
  const [options, setOptions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = inputValue.trim();
    if (q.length < 2) {
      setOptions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setLoading(true);
      searchPhotonPlaces(q, 12)
        .then(setOptions)
        .catch(() => setOptions([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [inputValue]);

  return (
    <Autocomplete<PlaceSuggestion, false, false, false>
      options={options}
      loading={loading}
      filterOptions={(opts) => opts}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      value={place}
      onChange={(_, newVal) => {
        if (newVal) {
          onPlaceChange(newVal, newVal.label);
        } else {
          onPlaceChange(null, '');
        }
      }}
      inputValue={inputValue}
      onInputChange={(_, newInput, reason) => {
        if (reason === 'clear') {
          onPlaceChange(null, '');
          return;
        }
        if (reason === 'reset') {
          return;
        }
        const stillMatches = place && newInput === place.label;
        onPlaceChange(stillMatches ? place : null, newInput);
      }}
      disabled={disabled}
      noOptionsText={
        inputValue.trim().length < 2
          ? 'Введите не менее 2 символов'
          : loading
            ? 'Поиск…'
            : 'Ничего не найдено'
      }
      renderInput={(params) => (
        <TextField {...params} label={fieldLabel} helperText={helperText} />
      )}
    />
  );
}
