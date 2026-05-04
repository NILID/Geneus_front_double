import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { fetchGalleryPhotos, type GalleryPhoto } from '../api/galleryPhotoApi';
import { fetchIdeas, type Idea } from '../api/ideaApi';
import {
  fetchRecentPeople,
  personDisplayName,
  type PersonHomeRow,
} from '../api/personApi';

const HOME_PHOTO_LIMIT = 8;
const HOME_IDEA_LIMIT = 6;

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

function truncateText(text: string, max = 160): string {
  const t = text.trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max).trim()}…`;
}

function NavTileGlyph({ label }: { label: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 40,
        height: 40,
        borderRadius: 1,
        bgcolor: 'primary.main',
        opacity: 0.2,
        display: 'grid',
        placeItems: 'center',
        color: 'primary.light',
        fontSize: '0.95rem',
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {label}
    </Box>
  );
}

export function HomePage() {
  const [people, setPeople] = useState<PersonHomeRow[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [ppl, ph, id] = await Promise.all([
        fetchRecentPeople(),
        fetchGalleryPhotos(),
        fetchIdeas(),
      ]);
      setPeople(ppl);
      setPhotos(ph.slice(0, HOME_PHOTO_LIMIT));
      setIdeas(id.slice(0, HOME_IDEA_LIMIT));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить главную');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
          <Stack
            spacing={2.5}
            sx={{ maxWidth: 640, alignItems: { xs: 'stretch', sm: 'flex-start' } }}
          >
            <Chip
              label="Семейная хроника"
              size="small"
              sx={{
                alignSelf: { xs: 'center', sm: 'flex-start' },
                bgcolor: 'rgba(144, 202, 249, 0.12)',
                color: 'primary.light',
                borderColor: 'rgba(144, 202, 249, 0.35)',
                borderWidth: 1,
                borderStyle: 'solid',
              }}
            />
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
              Здесь собраны персоны, фотографии и заметки семьи. Откройте интерактивное древо связей или
              загляните в медиа и на карту мест.
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
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={0.5} sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Сейчас в проекте
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Недавние обновления и быстрые ссылки
          </Typography>
        </Stack>

        <Grid container spacing={1.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              component={RouterLink}
              to="/tree"
              sx={{
                p: 2,
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                height: '100%',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <NavTileGlyph label="⎔" />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Древо
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    связи и редактирование
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              component={RouterLink}
              to="/media"
              sx={{
                p: 2,
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                height: '100%',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <NavTileGlyph label="М" />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Медиа
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    галерея фотографий
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              component={RouterLink}
              to="/map"
              sx={{
                p: 2,
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                height: '100%',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <NavTileGlyph label="К" />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Карта
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    места рождения и смерти
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              component={RouterLink}
              to="/ideas"
              sx={{
                p: 2,
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                height: '100%',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <NavTileGlyph label="И" />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Идеи
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    заметки и обсуждения
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {loading ? (
          <Typography color="text.secondary">Загрузка…</Typography>
        ) : (
          <Stack spacing={4}>
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
                              src={p.avatar_url ?? undefined}
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
                <Grid container spacing={1.5}>
                  {photos.map((ph) => (
                    <Grid key={ph.id} size={{ xs: 12, sm: 6, md: 3 }}>
                      <Card variant="outlined" sx={{ height: '100%', overflow: 'hidden' }}>
                        <CardActionArea component={RouterLink} to="/media">
                          {ph.image_url ? (
                            <CardMedia
                              component="img"
                              height="140"
                              image={ph.image_url}
                              alt={ph.caption ?? 'Фото'}
                              sx={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <Box sx={{ height: 140, bgcolor: 'action.hover' }} />
                          )}
                          <CardContent sx={{ py: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {formatRuDate(ph.created_at)}
                              {ph.taken_year != null ? ` · ${ph.taken_year}` : ''}
                            </Typography>
                            {ph.caption && (
                              <Typography variant="body2" noWrap>
                                {ph.caption}
                              </Typography>
                            )}
                          </CardContent>
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
                    Свежие идеи
                  </Typography>
                </Stack>
                <Button component={RouterLink} to="/ideas" size="small" color="inherit">
                  Все идеи
                </Button>
              </Stack>
              {ideas.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Заметок пока нет — поделитесь мыслью в разделе «Идеи».
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {ideas.map((idea) => (
                    <Paper key={idea.id} variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {formatRuDate(idea.created_at)}
                        {idea.comments_count > 0
                          ? ` · ${idea.comments_count} отв.`
                          : ''}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {truncateText(idea.body)}
                      </Typography>
                      <Button
                        component={RouterLink}
                        to="/ideas"
                        size="small"
                        sx={{ mt: 1, p: 0, minWidth: 0 }}
                      >
                        Открыть обсуждение
                      </Button>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
