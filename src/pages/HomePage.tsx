import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { resolveRailsBlobUrl } from '../api/assetUrls';
import { createInvitationLinkRequest, sendInvitationRequest } from '../auth/authApi';
import { useAuth } from '../auth/AuthContext';
import { canSendInvitations } from '../auth/roles';
import { fetchGalleryPhotos, type GalleryPhoto } from '../api/galleryPhotoApi';
import {
  fetchRecentPeople,
  fetchUpcomingBirthdays,
  personDisplayName,
  type PersonBirthdayRow,
  type PersonHomeRow,
} from '../api/personApi';
import { fetchHomeStats, type HomeStats } from '../api/homeApi';
import { GalleryPhotoViewerModal } from '../components/GalleryPhotoViewerModal';
import { HomeBirthdaysBlock } from '../components/HomeBirthdaysBlock';
import { HomeStatsCard } from '../components/HomeStatsCard';

const HOME_PEOPLE_LIMIT = 6;
const HOME_PHOTO_LIMIT = 8;

const INVITE_TAB_EMAIL = 0;
const INVITE_TAB_LINK = 1;

function formatRuDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatRuDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function HomePage() {
  const { user } = useAuth();
  const showInvite = canSendInvitations(user?.role);
  const [people, setPeople] = useState<PersonHomeRow[]>([]);
  const [birthdays, setBirthdays] = useState<PersonBirthdayRow[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [homeStats, setHomeStats] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTab, setInviteTab] = useState(INVITE_TAB_EMAIL);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteSnackbar, setInviteSnackbar] = useState<string | null>(null);

  const [inviteLinkEmail, setInviteLinkEmail] = useState('');
  const [inviteLinkError, setInviteLinkError] = useState<string | null>(null);
  const [inviteLinkBusy, setInviteLinkBusy] = useState(false);
  const [inviteLinkPayload, setInviteLinkPayload] = useState<{
    invitation_text: string;
    invitation_url: string;
    invitation_expires_at?: string;
  } | null>(null);

  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [ppl, ph, bdays, stats] = await Promise.all([
        fetchRecentPeople(),
        fetchGalleryPhotos(),
        fetchUpcomingBirthdays(),
        fetchHomeStats(),
      ]);
      setPeople(ppl.slice(0, HOME_PEOPLE_LIMIT));
      setBirthdays(bdays);
      setPhotos(ph.slice(0, HOME_PHOTO_LIMIT));
      setHomeStats(stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить главную');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const inviteDialogBusy = inviteBusy || inviteLinkBusy;

  function openInviteDialog() {
    setInviteTab(INVITE_TAB_EMAIL);
    setInviteError(null);
    setInviteLinkError(null);
    setInviteLinkPayload(null);
    setInviteEmail('');
    setInviteLinkEmail('');
    setInviteOpen(true);
  }

  function closeInviteDialog() {
    if (inviteDialogBusy) {
      return;
    }
    setInviteOpen(false);
    setInviteTab(INVITE_TAB_EMAIL);
    setInviteEmail('');
    setInviteError(null);
    setInviteLinkEmail('');
    setInviteLinkError(null);
    setInviteLinkPayload(null);
  }

  async function onInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteBusy(true);
    try {
      await sendInvitationRequest(inviteEmail);
      closeInviteDialog();
      setInviteSnackbar('Приглашение отправлено на указанный email');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Не удалось отправить приглашение');
    } finally {
      setInviteBusy(false);
    }
  }

  async function onInviteLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInviteLinkError(null);
    setInviteLinkBusy(true);
    try {
      const payload = await createInvitationLinkRequest(inviteLinkEmail);
      setInviteLinkPayload({
        invitation_text: payload.invitation_text,
        invitation_url: payload.invitation_url,
        invitation_expires_at: payload.invitation_expires_at,
      });
      setInviteSnackbar('Текст приглашения сгенерирован');
    } catch (err) {
      setInviteLinkError(
        err instanceof Error ? err.message : 'Не удалось создать приглашение',
      );
    } finally {
      setInviteLinkBusy(false);
    }
  }

  async function copyToClipboard(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setInviteSnackbar(successMessage);
    } catch {
      setInviteSnackbar('Не удалось скопировать — выделите текст вручную');
    }
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background:
            'linear-gradient(135deg, rgba(25, 55, 88, 0.95) 0%, rgba(12, 18, 32, 0.98) 50%, rgba(30, 20, 50, 0.96) 100%)',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.12,
            backgroundImage: 'radial-gradient(circle at 20% 20%, #90caf9 0, transparent 40%)',
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 4, sm: 6 } }}>
          <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
            <Grid size={{ xs: 12, md: 7 }} sx={{ minWidth: 0 }}>
              <Stack
                spacing={2.5}
                sx={{ maxWidth: 640, alignItems: { xs: 'stretch', sm: 'flex-start' } }}
              >
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    fontSize: { xs: '1.85rem', sm: '2.25rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Добро пожаловать
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
                  Здесь собраны персоны, фотографии и заметки семьи. Откройте интерактивное древо связей
                  или загляните в медиа и на карту мест.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
                  <Button
                    component={RouterLink}
                    to="/tree"
                    variant="contained"
                    size="large"
                    sx={{ px: 2.5 }}
                  >
                    Открыть древо
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/media"
                    variant="outlined"
                    size="large"
                    color="inherit"
                  >
                    Медиа
                  </Button>
                  {showInvite ? (
                    <Button
                      type="button"
                      variant="outlined"
                      size="large"
                      color="inherit"
                      onClick={openInviteDialog}
                    >
                      Пригласить
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            </Grid>
            <Grid
              size={{ xs: 12, md: 5 }}
              sx={{
                display: 'flex',
                justifyContent: { xs: 'center', md: 'flex-end' },
                alignItems: { md: 'center' },
              }}
            >
              <HomeStatsCard stats={homeStats} loading={loading} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Dialog
        open={inviteOpen}
        onClose={() => {
          if (inviteDialogBusy) {
            return;
          }
          closeInviteDialog();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Пригласить</DialogTitle>
        <Tabs
          value={inviteTab}
          onChange={(_, v) => {
            setInviteTab(v);
            setInviteError(null);
            setInviteLinkError(null);
          }}
          variant="fullWidth"
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="По email" />
          <Tab label="Ссылка для копирования" />
        </Tabs>

        <DialogContent sx={{ pt: 2 }}>
          {inviteTab === INVITE_TAB_EMAIL && (
            <Stack spacing={2} component="form" onSubmit={onInviteSubmit}>
              <Typography variant="body2" color="text.secondary">
                На указанный адрес уйдёт письмо со ссылкой для регистрации.
              </Typography>
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                value={inviteEmail}
                onChange={(ev) => setInviteEmail(ev.target.value)}
                required
                fullWidth
                autoFocus
              />
              {inviteError && (
                <Alert severity="error" onClose={() => setInviteError(null)}>
                  {inviteError}
                </Alert>
              )}
              <Stack direction="row" spacing={1} sx={{ pt: 1, justifyContent: 'flex-end' }}>
                <Button type="button" onClick={closeInviteDialog} disabled={inviteBusy}>
                  Отмена
                </Button>
                <Button type="submit" variant="contained" disabled={inviteBusy}>
                  {inviteBusy ? 'Отправка…' : 'Отправить'}
                </Button>
              </Stack>
            </Stack>
          )}

          {inviteTab === INVITE_TAB_LINK && (
            <Stack spacing={2} component="form" onSubmit={onInviteLinkSubmit}>
              <Typography variant="body2" color="text.secondary">
                Укажите email гостя: будет создано приглашение без письма. Скопируйте текст или ссылку и
                отправьте сами (мессенджер, другой почтовый ящик и т.д.).
              </Typography>
              {!inviteLinkPayload ? (
                <TextField
                  label="Email гостя"
                  type="email"
                  autoComplete="email"
                  value={inviteLinkEmail}
                  onChange={(ev) => setInviteLinkEmail(ev.target.value)}
                  required
                  fullWidth
                  autoFocus
                />
              ) : (
                <>
                  {inviteLinkPayload.invitation_expires_at ? (
                    <Alert severity="info" icon={false}>
                      Ссылка действует до{' '}
                      {formatRuDateTime(inviteLinkPayload.invitation_expires_at)} (время сервера).
                    </Alert>
                  ) : null}
                  <TextField
                    label="Полный текст"
                    value={inviteLinkPayload.invitation_text}
                    fullWidth
                    multiline
                    minRows={8}
                    slotProps={{ htmlInput: { readOnly: true } }}
                  />
                  <TextField
                    label="Только ссылка"
                    value={inviteLinkPayload.invitation_url}
                    fullWidth
                    slotProps={{ htmlInput: { readOnly: true } }}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={() =>
                        void copyToClipboard(inviteLinkPayload.invitation_text, 'Текст скопирован')
                      }
                    >
                      Копировать текст
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={() =>
                        void copyToClipboard(inviteLinkPayload.invitation_url, 'Ссылка скопирована')
                      }
                    >
                      Копировать ссылку
                    </Button>
                  </Stack>
                </>
              )}
              {inviteLinkError && (
                <Alert severity="error" onClose={() => setInviteLinkError(null)}>
                  {inviteLinkError}
                </Alert>
              )}
              <Stack direction="row" spacing={1} sx={{ pt: 1, justifyContent: 'flex-end' }}>
                <Button type="button" onClick={closeInviteDialog} disabled={inviteLinkBusy}>
                  {inviteLinkPayload ? 'Закрыть' : 'Отмена'}
                </Button>
                {!inviteLinkPayload ? (
                  <Button type="submit" variant="contained" disabled={inviteLinkBusy}>
                    {inviteLinkBusy ? 'Создание…' : 'Создать ссылку'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => {
                      setInviteLinkPayload(null);
                      setInviteLinkEmail('');
                    }}
                  >
                    Другой email
                  </Button>
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={Boolean(inviteSnackbar)}
        autoHideDuration={6000}
        onClose={() => setInviteSnackbar(null)}
        message={inviteSnackbar}
      />

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Typography color="text.secondary">Загрузка…</Typography>
        ) : (
          <Stack spacing={4}>
            <HomeBirthdaysBlock birthdays={birthdays} />

            <Box>
              <Stack
                direction="row"
                sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    Недавно обновлённые персоны
                  </Typography>
                </Stack>
                <Button component={RouterLink} to="/tree" size="small" color="inherit">
                  Всё древо
                </Button>
              </Stack>
              {people.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Пока никого не добавили — начните с древа.
                </Typography>
              ) : (
                <Grid container spacing={1.5}>
                  {people.map((p) => (
                    <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardActionArea
                          component={RouterLink}
                          to={`/person/${encodeURIComponent(p.chart_external_id)}`}
                          sx={{ alignItems: 'stretch', height: '100%' }}
                        >
                          <Stack direction="row" spacing={2} sx={{ p: 2, alignItems: 'center' }}>
                            <Avatar
                              src={resolveRailsBlobUrl(p.avatar_url)}
                              alt={personDisplayName(p)}
                              sx={{ width: 56, height: 56 }}
                            >
                              {p.first_name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
                                {personDisplayName(p)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                обновлено {formatRuDate(p.updated_at)}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            <Box>
              <Stack
                direction="row"
                sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    Новые фото
                  </Typography>
                </Stack>
                <Button component={RouterLink} to="/media" size="small" color="inherit">
                  Вся галерея
                </Button>
              </Stack>
              {photos.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Фотографий пока нет — загрузите первую в разделе «Медиа».
                </Typography>
              ) : (
                <>
                  <GalleryPhotoViewerModal
                    open={photoViewerOpen}
                    onClose={() => setPhotoViewerOpen(false)}
                    photos={photos}
                    index={photoViewerIndex}
                    onIndexChange={setPhotoViewerIndex}
                    currentUserId={user?.id}
                    onCommentsCountChange={(photoId, commentsCount) => {
                      setPhotos((prev) =>
                        prev.map((p) => (p.id === photoId ? { ...p, comments_count: commentsCount } : p)),
                      );
                    }}
                  />
                  <Grid container spacing={1.5}>
                    {photos.map((ph, photoIndex) => (
                      <Grid key={ph.id} size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card variant="outlined" sx={{ overflow: 'hidden' }}>
                          <CardActionArea
                            onClick={() => {
                              setPhotoViewerIndex(photoIndex);
                              setPhotoViewerOpen(true);
                            }}
                            aria-label="Открыть фото"
                          >
                            {resolveRailsBlobUrl(ph.image_url) ? (
                              <CardMedia
                                component="img"
                                height="140"
                                image={resolveRailsBlobUrl(ph.image_url)}
                                alt="Фото"
                                sx={{ objectFit: 'cover', display: 'block' }}
                              />
                            ) : (
                              <Box sx={{ height: 140, bgcolor: 'action.hover' }} />
                            )}
                          </CardActionArea>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </Box>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
