import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import MuiAvatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  fetchPerson,
  personDisplayName,
  type PersonDetail,
  type PersonSummary,
} from '../api/personApi';
import { SessionLoading } from '../components/SessionLoading';
import useFancybox from '../hooks/useFancybox';

function RelatedList({ title, people }: { title: string; people: PersonSummary[] }) {
  if (people.length === 0) {
    return null;
  }
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h2" component="h2" gutterBottom>
        {title}
      </Typography>
      <List dense disablePadding>
        {people.map((p) => (
          <ListItem key={p.id} disablePadding sx={{ py: 0.25 }}>
            <ListItemButton
              component={RouterLink}
              to={`/person/${encodeURIComponent(String(p.id))}`}
            >
              <ListItemText primary={personDisplayName(p)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

function personAvatarFallback(p: PersonDetail): string {
  const fn = p.first_name.trim();
  const ln = p.last_name?.trim();
  if (fn && ln) {
    return (fn[0] + ln[0]).toUpperCase();
  }
  if (fn.length >= 2) {
    return fn.slice(0, 2).toUpperCase();
  }
  return fn.slice(0, 1).toUpperCase() || '?';
}

function FactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack spacing={1} sx={{ flexDirection: { xs: 'column', sm: 'row' }, py: 0.75 }}>
      <Typography component="dt" variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
        {label}
      </Typography>
      <Typography component="dd" variant="body1" sx={{ m: 0 }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const [setFancyboxRoot] = useFancybox({});
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError('По такому id не найдена персона');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPerson(id)
      .then((p) => {
        if (!cancelled) {
          setPerson(p);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setPerson(null);
          setError(e instanceof Error ? e.message : 'Произошла ошибка при загрузке персоны');
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

  if (loading) {
    return <SessionLoading message="Загружаем персону…" />;
  }

  if (error || !person) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {error ?? 'Не найдено'}
        </Alert>
        <Button component={RouterLink} to="/" variant="contained">
          Назад к древу
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Семейное древо
        </Link>
        <Typography color="text.primary">{personDisplayName(person)}</Typography>
      </Breadcrumbs>

      {id && (
        <Button
          component={RouterLink}
          to={`/person/${encodeURIComponent(id)}/edit`}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Редактировать
        </Button>
      )}

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'center', sm: 'flex-start' },
            mb: 2,
          }}
        >
          <MuiAvatar
            src={person.avatar_url ?? undefined}
            alt={personDisplayName(person)}
            sx={{ width: 120, height: 120, flexShrink: 0 }}
          >
            {person.avatar_url ? null : personAvatarFallback(person)}
          </MuiAvatar>
          <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h1" component="h1" gutterBottom>
              {personDisplayName(person)}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 1,
                justifyContent: { xs: 'center', sm: 'flex-start' },
              }}
            >
              {person.chart_id && person.chart_id !== person.chart_external_id && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    stored
                  </Typography>
                  <Chip size="small" label={person.chart_id} variant="outlined" />
                </>
              )}
            </Box>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box component="dl" sx={{ m: 0 }}>
          {person.date_of_birth && <FactRow label="Дата рождения" value={person.date_of_birth} />}
          {person.date_of_death && <FactRow label="Дата смерти" value={person.date_of_death} />}
          {person.location_of_birth && (
            <FactRow label="Место рождения" value={person.location_of_birth} />
          )}
          {person.location_of_death && (
            <FactRow label="Место смерти" value={person.location_of_death} />
          )}
          {person.bio && <FactRow label="Биография" value={person.bio} />}
        </Box>

        <RelatedList title="Родители" people={person.parents} />
        <RelatedList title="Партнеры" people={person.partners} />
        <RelatedList title="Дети" people={person.children} />

        {person.tagged_gallery_photos.length > 0 && (
          <Box ref={setFancyboxRoot} sx={{ mt: 3, width: '100%' }}>
            <Typography variant="h2" component="h2" gutterBottom>
              Фотографии, где отмечена эта персона
            </Typography>
            <ImageList variant="masonry" cols={3} gap={10} sx={{ width: '100%' }}>
              {person.tagged_gallery_photos.map((ph) => {
                const fancyCaption = [
                  ph.caption?.trim() ? ph.caption : 'Без подписи',
                  new Date(ph.created_at).toLocaleString(),
                ]
                  .filter((s) => s !== '')
                  .join(' · ');
                return (
                  <ImageListItem key={ph.id} sx={{ borderRadius: 1, overflow: 'hidden' }}>
                    {ph.image_url ? (
                      <a
                        href={ph.image_url}
                        data-fancybox={`person-${person.id}`}
                        data-caption={fancyCaption}
                        style={{
                          display: 'block',
                          textDecoration: 'none',
                          color: 'inherit',
                          lineHeight: 0,
                        }}
                      >
                        <img
                          src={ph.image_url}
                          alt={ph.caption ?? ''}
                          loading="lazy"
                          style={{ width: '100%', height: 'auto', display: 'block', verticalAlign: 'bottom' }}
                        />
                      </a>
                    ) : (
                      <Box sx={{ minHeight: 100, bgcolor: 'action.hover' }} />
                    )}
                    <ImageListItemBar
                      title={ph.caption?.trim() ? ph.caption : 'Без подписи'}
                      position="bottom"
                    />
                  </ImageListItem>
                );
              })}
            </ImageList>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
