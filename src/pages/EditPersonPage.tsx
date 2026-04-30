import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
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
  type PersonUpdateInput,
} from '../api/personApi';
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

export function EditPersonPage() {
  const { personId } = useParams<{ personId: string }>();
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
  const [locationOfBirth, setLocationOfBirth] = useState('');
  const [locationOfDeath, setLocationOfDeath] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!personId) {
      setLoadError('По такому id не найдена персона');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchPerson(personId)
      .then((p) => {
        if (cancelled) {
          return;
        }
        setDisplayName(personDisplayName(p));
        setFirstName(p.first_name);
        setLastName(p.last_name ?? '');
        setGender(p.gender);
        setBio(p.bio ?? '');
        setDateOfBirth(isoToDateInput(p.date_of_birth));
        setDateOfDeath(isoToDateInput(p.date_of_death));
        setLocationOfBirth(p.location_of_birth ?? '');
        setLocationOfDeath(p.location_of_death ?? '');
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
  }, [personId]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!personId) {
      return;
    }
    setSaveError(null);
    setSaving(true);
    const input: PersonUpdateInput = {
      first_name: firstName,
      last_name: lastName.trim() ? lastName : null,
      gender,
      bio: bio || null,
      date_of_birth: dateOfBirth || null,
      date_of_death: dateOfDeath || null,
      location_of_birth: locationOfBirth || null,
      location_of_death: locationOfDeath || null,
    };
    if (avatarFile) {
      input.avatar = avatarFile;
    }
    updatePerson(personId, input)
      .then((updated) => {
        navigate(`/person/${encodeURIComponent(updated.chart_external_id)}`, { replace: true });
      })
      .catch((err: unknown) => {
        setSaveError(err instanceof Error ? err.message : 'Не удалось сохранить');
      })
      .finally(() => {
        setSaving(false);
      });
  }

  if (loading) {
    return <SessionLoading message="Загружаем персону…" />;
  }

  if (loadError || !personId) {
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

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Семейное древо
        </Link>
        <Link
          component={RouterLink}
          to={`/person/${encodeURIComponent(personId)}`}
          underline="hover"
          color="inherit"
        >
          {displayName || 'Персона'}
        </Link>
        <Typography color="text.primary">Редактирование</Typography>
      </Breadcrumbs>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Редактировать персону
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

            <TextField
              label="Дата рождения"
              name="date_of_birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Дата смерти"
              name="date_of_death"
              type="date"
              value={dateOfDeath}
              onChange={(e) => setDateOfDeath(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Место рождения"
              name="location_of_birth"
              value={locationOfBirth}
              onChange={(e) => setLocationOfBirth(e.target.value)}
              fullWidth
            />

            <TextField
              label="Место смерти"
              name="location_of_death"
              value={locationOfDeath}
              onChange={(e) => setLocationOfDeath(e.target.value)}
              fullWidth
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
                to={`/person/${encodeURIComponent(personId)}`}
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
    </Container>
  );
}
