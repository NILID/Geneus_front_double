import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import {
  fetchPerson,
  personDisplayName,
  type PersonDetail,
  type PersonSummary,
} from '../api/personApi';
import { fetchPersonFacts, type PersonFact } from '../api/personFactsApi';
import { useAuth } from '../auth/AuthContext';
import { GalleryPhotoMasonry } from '../components/GalleryPhotoMasonry';
import { AddPersonFactForm, PersonFactsPeekList } from '../components/PersonFactsWidgets';
import { PersonProfileShell } from '../components/PersonProfileShell';
import { SessionLoading } from '../components/SessionLoading';
import { formatGenealogyDateForDisplay } from '../lib/genealogyDateFormat';

function ProfileSectionCard({
  title,
  children,
  headerRight,
}: {
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {headerRight != null ? headerRight : null}
      </Box>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
}

function PlusIcon(props: { fontSize?: 'small' | 'medium' | 'large' | 'inherit' }) {
  return (
    <SvgIcon fontSize={props.fontSize ?? 'small'} viewBox="0 0 24 24">
      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </SvgIcon>
  );
}

function RelatedSection({ title, people }: { title: string; people: PersonSummary[] }) {
  if (people.length === 0) {
    return null;
  }
  return (
    <Box sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.4, display: 'block', mb: 1 }}>
        {title.toUpperCase()}
      </Typography>
      <Stack spacing={0.75}>
        {people.map((p) => (
          <Link
            key={p.id}
            component={RouterLink}
            to={`/person/${encodeURIComponent(String(p.id))}`}
            underline="hover"
            color="primary"
            variant="body2"
            sx={{ fontWeight: 500 }}
          >
            {personDisplayName(p)}
          </Link>
        ))}
      </Stack>
    </Box>
  );
}

function PersonDetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack spacing={0.5} sx={{ py: 1, '&:first-of-type': { pt: 0 } }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [factsDialogOpen, setFactsDialogOpen] = useState(false);
  const [factsDialogKey, setFactsDialogKey] = useState(0);
  const [personFacts, setPersonFacts] = useState<PersonFact[]>([]);
  const [factsLoading, setFactsLoading] = useState(true);

  const reloadPerson = useCallback(() => {
    if (!id) {
      return Promise.resolve();
    }
    return fetchPerson(id).then(setPerson);
  }, [id]);

  const reloadFacts = useCallback(async () => {
    if (!id) {
      return;
    }
    setFactsLoading(true);
    try {
      const list = await fetchPersonFacts(id);
      setPersonFacts(list);
    } catch {
      setPersonFacts([]);
    } finally {
      setFactsLoading(false);
    }
  }, [id]);

  const openFactsDialog = useCallback(() => {
    setFactsDialogKey((k) => k + 1);
    setFactsDialogOpen(true);
  }, []);

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

  useEffect(() => {
    if (!id) {
      return;
    }
    let cancelled = false;
    setFactsLoading(true);
    fetchPersonFacts(id)
      .then((list) => {
        if (!cancelled) {
          setPersonFacts(list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPersonFacts([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setFactsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <SessionLoading message="Загружаем персону…" />;
  }

  if (error || !person || !id) {
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

  const hasDetails =
    Boolean(person.date_of_birth) ||
    Boolean(person.date_of_death) ||
    Boolean(person.location_of_birth) ||
    Boolean(person.location_of_death) ||
    Boolean(person.bio);

  const hasFamily =
    person.parents.length > 0 || person.partners.length > 0 || person.children.length > 0;

  const breadcrumbs = (
    <Breadcrumbs sx={{ '& li': { typography: 'body2' } }}>
      <Link component={RouterLink} to="/" underline="hover" color="inherit">
        Семейное древо
      </Link>
      <Typography color="text.primary">{personDisplayName(person)}</Typography>
    </Breadcrumbs>
  );

  return (
    <PersonProfileShell person={person} personId={id} activeTab="overview" breadcrumbs={breadcrumbs}>
      <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 320px) minmax(0, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Stack spacing={2}>
          <ProfileSectionCard title="Сведения">
            {!hasDetails ? (
              <Typography variant="body2" color="text.secondary">
                Даты и места можно добавить во вкладке «Редактировать».
              </Typography>
            ) : (
              <Box component="dl" sx={{ m: 0 }}>
                {person.date_of_birth && (
                  <PersonDetailRow
                    label="Дата рождения"
                    value={formatGenealogyDateForDisplay(person.date_of_birth)}
                  />
                )}
                {person.date_of_death && (
                  <PersonDetailRow
                    label="Дата смерти"
                    value={formatGenealogyDateForDisplay(person.date_of_death)}
                  />
                )}
                {person.location_of_birth && (
                  <PersonDetailRow label="Место рождения" value={person.location_of_birth} />
                )}
                {person.location_of_death && (
                  <PersonDetailRow label="Место смерти" value={person.location_of_death} />
                )}
                {person.bio && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <PersonDetailRow label="Биография" value={person.bio} />
                  </>
                )}
              </Box>
            )}
          </ProfileSectionCard>

          <ProfileSectionCard title="Семья">
            {!hasFamily ? (
              <Typography variant="body2" color="text.secondary">
                Связи появятся в древе, когда будут добавлены родственники.
              </Typography>
            ) : (
              <>
                <RelatedSection title="Родители" people={person.parents} />
                <RelatedSection title="Партнёры" people={person.partners} />
                <RelatedSection title="Дети" people={person.children} />
              </>
            )}
          </ProfileSectionCard>
        </Stack>

        <Stack spacing={2}>
          <ProfileSectionCard
            title="Факты"
            headerRight={
              id ? (
                <IconButton
                  size="small"
                  aria-label="Добавить факт"
                  aria-haspopup="dialog"
                  aria-expanded={factsDialogOpen}
                  onClick={openFactsDialog}
                  sx={{ mr: -0.5 }}
                >
                  <PlusIcon />
                </IconButton>
              ) : null
            }
          >
            {factsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} aria-label="Загрузка фактов" />
              </Box>
            ) : personFacts.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Button type="button" variant="outlined" onClick={openFactsDialog}>
                  Добавить первый факт
                </Button>
              </Box>
            ) : (
              <PersonFactsPeekList facts={personFacts} personId={id} />
            )}
          </ProfileSectionCard>

          <ProfileSectionCard title="Фотографии">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Снимки из галереи, где отмечена эта персона.
            </Typography>
            <GalleryPhotoMasonry
              photos={person.tagged_gallery_photos}
              fancyboxGroup={`person-${person.id}`}
              cols={3}
              gap={10}
              sx={{ width: '100%' }}
              menuIdPrefix={`person-${person.id}-gallery-photo`}
              currentUserId={user?.id}
              onGalleryPhotoCommentsCountChange={(photoId, commentsCount) => {
                setPerson((prev) => {
                  if (!prev) {
                    return prev;
                  }
                  return {
                    ...prev,
                    tagged_gallery_photos: prev.tagged_gallery_photos.map((p) =>
                      p.id === photoId ? { ...p, comments_count: commentsCount } : p,
                    ),
                  };
                });
              }}
            />
          </ProfileSectionCard>
        </Stack>
      </Box>

      <Dialog
        open={factsDialogOpen}
        onClose={() => setFactsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="person-add-fact-dialog-title"
      >
        <DialogTitle id="person-add-fact-dialog-title">Новый факт</DialogTitle>
        <DialogContent>
          <AddPersonFactForm
            key={factsDialogKey}
            personId={id}
            onAdded={async () => {
              await reloadPerson();
              await reloadFacts();
              setFactsDialogOpen(false);
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFactsDialogOpen(false)}>Отмена</Button>
        </DialogActions>
      </Dialog>
      </>
    </PersonProfileShell>
  );
}
