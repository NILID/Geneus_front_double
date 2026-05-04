import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { updateCurrentUserProfile } from '../auth/authApi';
import { useAuth } from '../auth/AuthContext';
import { chartPersonLinkSelectOptions, fetchFamilyChart, type FamilyChartData } from '../familyChartApi';

const NONE_VALUE = '';

export type AccountSettingsFormProps = {
  /** После успешного сохранения (например, закрыть модальное окно). */
  onSaved?: () => void;
  /** Уникальный префикс для `id` полей при нескольких экземплярах формы. */
  fieldIdPrefix?: string;
  /** Заголовок блока (на странице — крупнее, в диалоге можно не задавать). */
  title?: React.ReactNode;
  /** Показывать вводный текст под заголовком. */
  showIntro?: boolean;
};

export function AccountSettingsForm({
  onSaved,
  fieldIdPrefix = 'account',
  title,
  showIntro = true,
}: AccountSettingsFormProps) {
  const { user, refreshUser } = useAuth();
  const [chart, setChart] = useState<FamilyChartData | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [personId, setPersonId] = useState<string>(NONE_VALUE);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedHint, setSavedHint] = useState(false);

  const selectLabelId = `${fieldIdPrefix}-person-select-label`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchFamilyChart();
        if (!cancelled) {
          setChart(data);
          setChartError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setChartError(e instanceof Error ? e.message : 'Не удалось загрузить древо');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    const v = user.person_id;
    setPersonId(v != null && v > 0 ? String(v) : NONE_VALUE);
  }, [user]);

  const options = useMemo(() => {
    const base = chart ? chartPersonLinkSelectOptions(chart) : [];
    const pid = user?.person_id;
    if (!pid || base.some((o) => o.id === pid)) {
      return base;
    }
    return [
      ...base,
      {
        id: pid,
        label: `Персона #${pid} (нет в текущем древе на экране)`,
      },
    ].sort((a, b) => a.label.localeCompare(b.label, 'ru'));
  }, [chart, user?.person_id]);

  const handleSelectChange = useCallback((e: SelectChangeEvent<string>) => {
    setPersonId(e.target.value);
    setSaveError(null);
    setSavedHint(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaveError(null);
      setSavedHint(false);
      setSaving(true);
      try {
        const nextId = personId === NONE_VALUE ? null : Number(personId);
        await updateCurrentUserProfile({ person_id: nextId });
        await refreshUser();
        setSavedHint(true);
        if (onSaved) {
          window.setTimeout(() => onSaved(), 600);
        }
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Ошибка сохранения');
      } finally {
        setSaving(false);
      }
    },
    [personId, refreshUser, onSaved],
  );

  return (
    <Box>
      {title ? (
        <Typography variant="h5" component="h2" gutterBottom>
          {title}
        </Typography>
      ) : null}
      {showIntro ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Укажите персону из семейного древа, с которой связана эта учётная запись (например, вы сами).
        </Typography>
      ) : null}
      {user && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Email: <strong>{user.email}</strong>
        </Typography>
      )}
      {!chart && !chartError && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary">
            Загрузка списка персон…
          </Typography>
        </Box>
      )}
      <form onSubmit={(ev) => void handleSubmit(ev)}>
        <FormControl fullWidth disabled={!chart && !chartError} sx={{ mb: 2 }}>
          <InputLabel id={selectLabelId}>Персона в древе</InputLabel>
          <Select
            labelId={selectLabelId}
            label="Персона в древе"
            value={personId}
            onChange={handleSelectChange}
          >
            <MenuItem value={NONE_VALUE}>
              <em>Не привязана</em>
            </MenuItem>
            {options.map((o) => (
              <MenuItem key={o.id} value={String(o.id)}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {chartError && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {chartError}
          </Typography>
        )}
        {saveError && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {saveError}
          </Typography>
        )}
        {savedHint && (
          <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
            Сохранено.
          </Typography>
        )}
        <Button type="submit" variant="contained" disabled={saving || (!chart && !chartError)}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </form>
    </Box>
  );
}
