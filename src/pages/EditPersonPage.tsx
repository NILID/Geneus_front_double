import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import MuiAvatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  fetchPerson,
  personDisplayName,
  updatePerson,
  type PersonDetail,
  type PersonUpdateInput,
} from '../api/personApi';
import { PersonProfileShell } from '../components/PersonProfileShell';
import { PlaceAutocomplete } from '../components/PlaceAutocomplete';
import { SettlementMapPicker } from '../components/SettlementMapPicker';
import type { PlaceSuggestion } from '../lib/osmGeocode';
import { extractGenealogyYear } from '../lib/genealogyDateFormat';
import { resolvePlaceCoordinates } from '../lib/osmGeocode';
import { SessionLoading } from '../components/SessionLoading';

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  return iso.length >= 10 ? iso.slice(0, 10) : '';
}

const GENDERS: { value: string; label: string }[] = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
];

const LOCATION_HELPER =
  'Выберите населённый пункт из списка или кликните по карте ниже. Координаты для общей карты подставляются автоматически.';

export function EditPersonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('male');
  const [bio, setBio] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [birthYearOnly, setBirthYearOnly] = useState(false);
  const [deathYearOnly, setDeathYearOnly] = useState(false);
  const [birthYearInput, setBirthYearInput] = useState('');
  const [deathYearInput, setDeathYearInput] = useState('');

  const [birthPlace, setBirthPlace] = useState<PlaceSuggestion | null>(null);
  const [birthInput, setBirthInput] = useState('');
  const [deathPlace, setDeathPlace] = useState<PlaceSuggestion | null>(null);
  const [deathInput, setDeathInput] = useState('');

  const [personRecord, setPersonRecord] = useState<PersonDetail | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoadError('По такому id не найдена персона');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchPerson(id)
      .then((p) => {
        if (cancelled) {
          return;
        }
        setPersonRecord(p);
        setDisplayName(personDisplayName(p));
        setFirstName(p.first_name);
        setLastName(p.last_name ?? '');
        setGender(p.gender);
        setBio(p.bio ?? '');
        setBirthYearOnly(Boolean(p.birth_date_year_only));
        setDeathYearOnly(Boolean(p.death_date_year_only));
        setDateOfBirth(isoToDateInput(p.date_of_birth));
        setDateOfDeath(isoToDateInput(p.date_of_death));
        setBirthYearInput(extractGenealogyYear(p.date_of_birth ?? '') ?? '');
        setDeathYearInput(extractGenealogyYear(p.date_of_death ?? '') ?? '');

        const bLabel = p.location_of_birth ?? '';
        setBirthInput(bLabel);
        if (bLabel && p.birth_latitude != null && p.birth_longitude != null) {
          setBirthPlace({
            id: 'persisted-birth',
            label: bLabel,
            lat: p.birth_latitude,
            lng: p.birth_longitude,
          });
        } else {
          setBirthPlace(null);
        }

        const dLabel = p.location_of_death ?? '';
        setDeathInput(dLabel);
        if (dLabel && p.death_latitude != null && p.death_longitude != null) {
          setDeathPlace({
            id: 'persisted-death',
            label: dLabel,
            lat: p.death_latitude,
            lng: p.death_longitude,
          });
        } else {
          setDeathPlace(null);
        }

        setAvatarUrl(p.avatar_url ?? null);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить персону');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const profileForShell = useMemo((): PersonDetail | null => {
    if (!personRecord) {
      return null;
    }
    return {
      ...personRecord,
      first_name: firstName,
      last_name: lastName.trim() ? lastName : null,
      avatar_url: avatarPreview ?? avatarUrl ?? personRecord.avatar_url,
    };
  }, [personRecord, firstName, lastName, avatarPreview, avatarUrl]);

  function onAvatarPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) {
      return;
    }
    if (!f.type.startsWith('image/')) {
      setSaveError('Нужен файл в формате изображения');
      return;
    }
    setSaveError(null);
    setAvatarPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(f);
    });
    setAvatarFile(f);
  }

  function clearPickedAvatar() {
    setAvatarFile(null);
    setAvatarPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) {
      return;
    }
    setSaveError(null);

    if (birthYearOnly) {
      if (!dateOfBirth || !/^\d{4}-01-01$/.test(dateOfBirth)) {
        setSaveError('Укажите четырёхзначный год рождения (режим «известен только год»).');
        return;
      }
    }
    if (deathYearOnly) {
      if (!dateOfDeath || !/^\d{4}-01-01$/.test(dateOfDeath)) {
        setSaveError('Укажите четырёхзначный год смерти (режим «известен только год»).');
        return;
      }
    }

    setSaving(true);

    const birthText = birthInput.trim();
    const deathText = deathInput.trim();

    let birth_latitude: number | null = null;
    let birth_longitude: number | null = null;
    let death_latitude: number | null = null;
    let death_longitude: number | null = null;

    if (birthText) {
      const c = await resolvePlaceCoordinates(birthInput, birthPlace);
      if (!c) {
        setSaveError(
          'Не удалось получить координаты для места рождения. Выберите населённый пункт из выпадающего списка или уточните название.',
        );
        setSaving(false);
        return;
      }
      birth_latitude = c.lat;
      birth_longitude = c.lng;
    }

    if (deathText) {
      const c = await resolvePlaceCoordinates(deathInput, deathPlace);
      if (!c) {
        setSaveError(
          'Не удалось получить координаты для места смерти. Выберите населённый пункт из выпадающего списка или уточните название.',
        );
        setSaving(false);
        return;
      }
      death_latitude = c.lat;
      death_longitude = c.lng;
    }

    const input: PersonUpdateInput = {
      first_name: firstName,
      last_name: lastName.trim() ? lastName : null,
      gender,
      bio: bio || null,
      date_of_birth: dateOfBirth || null,
      date_of_death: dateOfDeath || null,
      birth_date_year_only: birthYearOnly,
      death_date_year_only: deathYearOnly,
      location_of_birth: birthText || null,
      location_of_death: deathText || null,
      birth_latitude,
      birth_longitude,
      death_latitude,
      death_longitude,
    };
    if (avatarFile) {
      input.avatar = avatarFile;
    }

    try {
      const updated = await updatePerson(id, input);
      navigate(`/person/${encodeURIComponent(String(updated.id))}`, { replace: true });
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <SessionLoading message="Загружаем персону…" />;
  }

  if (loadError || !id) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {loadError ?? 'Неверный адрес'}
        </Alert>
        <Button component={RouterLink} to="/" variant="contained">
          Назад к древу
        </Button>
      </Container>
    );
  }

  if (!personRecord || !profileForShell) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          Не удалось загрузить данные профиля
        </Alert>
        <Button component={RouterLink} to="/" variant="contained">
          Назад к древу
        </Button>
      </Container>
    );
  }

  const breadcrumbs = (
    <Breadcrumbs sx={{ '& li': { typography: 'body2' } }}>
      <Link component={RouterLink} to="/" underline="hover" color="inherit">
        Семейное древо
      </Link>
      <Link
        component={RouterLink}
        to={`/person/${encodeURIComponent(id)}`}
        underline="hover"
        color="inherit"
      >
        {displayName || personDisplayName(personRecord)}
      </Link>
      <Typography color="text.primary">Редактирование</Typography>
    </Breadcrumbs>
  );

  return (
    <PersonProfileShell person={profileForShell} personId={id} activeTab="edit" breadcrumbs={breadcrumbs}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          p: { xs: 2, sm: 3 },
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
          Данные персоны
        </Typography>

        <Box component="form" onSubmit={onSubmit} noValidate>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              {saveError}
            </Alert>
          )}
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Аватар
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
              >
                <MuiAvatar
                  src={avatarPreview ?? avatarUrl ?? undefined}
                  alt={personDisplayName({ first_name: firstName, last_name: lastName || null })}
                  sx={{ width: 96, height: 96 }}
                />
                <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <Button component="label" variant="outlined" disabled={saving}>
                    {avatarUrl || avatarFile ? 'Выбрать другое фото' : 'Загрузить фото'}
                    <input type="file" accept="image/*" hidden onChange={onAvatarPicked} />
                  </Button>
                  {avatarFile && (
                    <Button type="button" size="small" onClick={clearPickedAvatar} disabled={saving}>
                      Сбросить выбор
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>

            <TextField
              required
              label="Имя"
              name="first_name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              autoComplete="given-name"
            />

            <TextField
              label="Фамилия"
              name="last_name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              autoComplete="family-name"
            />

            <FormControl fullWidth>
              <InputLabel id="edit-person-gender-label">Пол</InputLabel>
              <Select
                labelId="edit-person-gender-label"
                id="edit-person-gender"
                name="gender"
                value={gender}
                label="Пол"
                onChange={(e: SelectChangeEvent) => setGender(e.target.value)}
              >
                {GENDERS.map((g) => (
                  <MenuItem key={g.value} value={g.value}>
                    {g.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              {birthYearOnly ? (
                <TextField
                  label="Год рождения"
                  name="birth_year"
                  value={birthYearInput}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setBirthYearInput(digits);
                    if (digits.length === 4) {
                      const y = Number(digits);
                      if (y >= 1 && y <= 9999) {
                        setDateOfBirth(`${digits}-01-01`);
                      }
                    } else {
                      setDateOfBirth('');
                    }
                  }}
                  fullWidth
                  placeholder="Например, 1920"
                  slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 4 } }}
                />
              ) : (
                <TextField
                  label="Дата рождения"
                  name="date_of_birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
              <FormControlLabel
                sx={{ mt: 0.5, alignItems: 'flex-start', ml: 0 }}
                control={
                  <Checkbox
                    checked={birthYearOnly}
                    onChange={(_, checked) => {
                      setBirthYearOnly(checked);
                      if (checked) {
                        const y = extractGenealogyYear(dateOfBirth);
                        if (y) {
                          setDateOfBirth(`${y}-01-01`);
                          setBirthYearInput(y);
                        } else {
                          setDateOfBirth('');
                          setBirthYearInput('');
                        }
                      }
                    }}
                  />
                }
                label="Известен только год рождения (день и месяц неизвестны)"
              />
            </Box>

            <Box>
              {deathYearOnly ? (
                <TextField
                  label="Год смерти"
                  name="death_year"
                  value={deathYearInput}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setDeathYearInput(digits);
                    if (digits.length === 4) {
                      const y = Number(digits);
                      if (y >= 1 && y <= 9999) {
                        setDateOfDeath(`${digits}-01-01`);
                      }
                    } else {
                      setDateOfDeath('');
                    }
                  }}
                  fullWidth
                  placeholder="Например, 1995"
                  slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 4 } }}
                />
              ) : (
                <TextField
                  label="Дата смерти"
                  name="date_of_death"
                  type="date"
                  value={dateOfDeath}
                  onChange={(e) => setDateOfDeath(e.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
              <FormControlLabel
                sx={{ mt: 0.5, alignItems: 'flex-start', ml: 0 }}
                control={
                  <Checkbox
                    checked={deathYearOnly}
                    onChange={(_, checked) => {
                      setDeathYearOnly(checked);
                      if (checked) {
                        const y = extractGenealogyYear(dateOfDeath);
                        if (y) {
                          setDateOfDeath(`${y}-01-01`);
                          setDeathYearInput(y);
                        } else {
                          setDateOfDeath('');
                          setDeathYearInput('');
                        }
                      }
                    }}
                  />
                }
                label="Известен только год смерти (день и месяц неизвестны)"
              />
            </Box>

            <PlaceAutocomplete
              fieldLabel="Место рождения"
              helperText={LOCATION_HELPER}
              place={birthPlace}
              inputValue={birthInput}
              onPlaceChange={(place, input) => {
                setBirthPlace(place);
                setBirthInput(input);
              }}
              disabled={saving}
            />

            <SettlementMapPicker
              title="Карта — место рождения"
              variant="birth"
              marker={
                birthPlace ? { lat: birthPlace.lat, lng: birthPlace.lng } : null
              }
              onPick={(s) => {
                setBirthPlace(s);
                setBirthInput(s.label);
              }}
              disabled={saving}
            />

            <PlaceAutocomplete
              fieldLabel="Место смерти"
              helperText={LOCATION_HELPER}
              place={deathPlace}
              inputValue={deathInput}
              onPlaceChange={(place, input) => {
                setDeathPlace(place);
                setDeathInput(input);
              }}
              disabled={saving}
            />

            <SettlementMapPicker
              title="Карта — место смерти"
              variant="death"
              marker={
                deathPlace ? { lat: deathPlace.lat, lng: deathPlace.lng } : null
              }
              onPick={(s) => {
                setDeathPlace(s);
                setDeathInput(s.label);
              }}
              disabled={saving}
            />

            <TextField
              label="Биография"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              fullWidth
              multiline
              minRows={3}
            />

            <Stack direction="row" spacing={2} sx={{ pt: 1, justifyContent: 'flex-end' }}>
              <Button
                component={RouterLink}
                to={`/person/${encodeURIComponent(id)}`}
                disabled={saving}
              >
                Отмена
              </Button>
              <Button type="submit" variant="contained" disabled={saving || !firstName.trim()}>
                {saving ? 'Сохраняем…' : 'Сохранить'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </PersonProfileShell>
  );
}
