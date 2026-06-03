import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  deleteGalleryPhoto,
  fetchGalleryPhotosPage,
  GALLERY_PHOTOS_PAGE_SIZE,
  updateGalleryPhoto,
  uploadGalleryPhoto,
  type GalleryPhoto,
  type GalleryPhotosPaginationMeta,
} from '../api/galleryPhotoApi';
import { useAuth } from '../auth/AuthContext';
import { canEditGenealogy } from '../auth/roles';
import { GalleryPhotoMasonry } from '../components/GalleryPhotoMasonry';
import { GalleryPhotoTagPeopleDialog } from '../components/GalleryPhotoTagPeopleDialog';
import { SessionLoading } from '../components/SessionLoading';
import { chartPersonLinkSelectOptions, fetchFamilyChart, type ChartPersonOption } from '../familyChartApi';
import type { GalleryPersonTagInput } from '../gallery/galleryPhotoRegion';

type YearFilterValue = 'all' | 'none' | number;

function distinctTakenYears(photos: GalleryPhoto[]): number[] {
  const set = new Set<number>();
  for (const p of photos) {
    if (p.taken_year != null && !Number.isNaN(p.taken_year)) {
      set.add(p.taken_year);
    }
  }
  return Array.from(set).sort((a, b) => b - a);
}

export function MediaPage() {
  const { user } = useAuth();
  const canEdit = canEditGenealogy(user?.role);
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const galleryCols = isMdUp ? 3 : isSmUp ? 2 : 1;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [galleryMeta, setGalleryMeta] = useState<GalleryPhotosPaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadTakenYear, setUploadTakenYear] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editPhoto, setEditPhoto] = useState<GalleryPhoto | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editTakenYear, setEditTakenYear] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [chartPeople, setChartPeople] = useState<ChartPersonOption[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [tagPhoto, setTagPhoto] = useState<GalleryPhoto | null>(null);
  const [tagSaving, setTagSaving] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<YearFilterValue>('all');

  const takenYearsInGallery = useMemo(() => distinctTakenYears(photos), [photos]);
  const hasPhotosWithoutYear = useMemo(() => photos.some((p) => p.taken_year == null), [photos]);

  const filteredPhotos = useMemo(() => {
    if (yearFilter === 'all') {
      return photos;
    }
    if (yearFilter === 'none') {
      return photos.filter((p) => p.taken_year == null);
    }
    return photos.filter((p) => p.taken_year === yearFilter);
  }, [photos, yearFilter]);

  useEffect(() => {
    if (yearFilter === 'none' && !hasPhotosWithoutYear) {
      setYearFilter('all');
    }
    if (typeof yearFilter === 'number' && !takenYearsInGallery.includes(yearFilter)) {
      setYearFilter('all');
    }
  }, [yearFilter, hasPhotosWithoutYear, takenYearsInGallery]);

  const load = useCallback(() => {
    setError(null);
    return fetchGalleryPhotosPage(1, GALLERY_PHOTOS_PAGE_SIZE)
      .then(({ photos: list, meta }) => {
        setPhotos(list);
        setGalleryMeta(meta);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Не удалось загрузить галерею');
      });
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !galleryMeta || galleryMeta.page >= galleryMeta.total_pages) {
      return;
    }
    setLoadingMore(true);
    setError(null);
    fetchGalleryPhotosPage(galleryMeta.page + 1, GALLERY_PHOTOS_PAGE_SIZE)
      .then(({ photos: list, meta }) => {
        setGalleryMeta(meta);
        setPhotos((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const next = list.filter((p) => !ids.has(p.id));
          return next.length > 0 ? [...prev, ...next] : prev;
        });
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Не удалось загрузить фотографии');
      })
      .finally(() => setLoadingMore(false));
  }, [galleryMeta, loading, loadingMore]);

  const hasMoreGalleryPhotos =
    galleryMeta != null && galleryMeta.page < galleryMeta.total_pages;

  useEffect(() => {
    let cancelled = false;
    fetchFamilyChart()
      .then((chart) => {
        if (!cancelled) {
          setChartPeople(chartPersonLinkSelectOptions(chart));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChartPeople([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGalleryPhotosPage(1, GALLERY_PHOTOS_PAGE_SIZE)
      .then(({ photos: list, meta }) => {
        if (!cancelled) {
          setPhotos(list);
          setGalleryMeta(meta);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Не удалось загрузить галерею');
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
  }, []);

  async function handleFilesSelected(files: FileList | null) {
    if (!files?.length) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const caption = uploadCaption.trim() === '' ? null : uploadCaption.trim();
      const ty = uploadTakenYear.trim();
      let takenYear: number | null = null;
      if (ty !== '') {
        const n = Number.parseInt(ty, 10);
        const maxY = new Date().getFullYear() + 1;
        if (!Number.isFinite(n) || n < 1800 || n > maxY) {
          setError('Год съёмки: введите число вроде 1995 или оставьте поле пустым');
          setUploading(false);
          return;
        }
        takenYear = n;
      }
      const fileArr = Array.from(files);
      await Promise.all(
        fileArr.map((f, i) =>
          uploadGalleryPhoto(f, i === 0 ? caption : null, undefined, i === 0 ? takenYear : null),
        ),
      );
      setUploadCaption('');
      setUploadTakenYear('');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await deleteGalleryPhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить');
    }
  }

  function closeEditDialog() {
    setEditPhoto(null);
    setEditCaption('');
    setEditTakenYear('');
    setEditFile(null);
    setEditError(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  }

  async function handleSaveEdit() {
    if (!editPhoto) {
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const cap = editCaption.trim() === '' ? null : editCaption.trim();
      const ty = editTakenYear.trim();
      let takenYear: number | null = null;
      if (ty !== '') {
        const n = Number.parseInt(ty, 10);
        const maxY = new Date().getFullYear() + 1;
        if (!Number.isFinite(n) || n < 1800 || n > maxY) {
          setEditError('Год съёмки: введите число вроде 1995 или оставьте поле пустым');
          setEditSaving(false);
          return;
        }
        takenYear = n;
      }
      await updateGalleryPhoto(editPhoto.id, {
        caption: cap,
        taken_year: takenYear,
        image: editFile ?? undefined,
      });
      await load();
      closeEditDialog();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setEditSaving(false);
    }
  }

  function closeTagDialog() {
    setTagPhoto(null);
    setTagError(null);
  }

  async function handleSaveTags(tags: GalleryPersonTagInput[]) {
    if (!tagPhoto) {
      return;
    }
    setTagSaving(true);
    setTagError(null);
    try {
      const updated = await updateGalleryPhoto(tagPhoto.id, { person_tags: tags });
      setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      closeTagDialog();
    } catch (e: unknown) {
      setTagError(e instanceof Error ? e.message : 'Не удалось сохранить отметки');
    } finally {
      setTagSaving(false);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2, px: { xs: 1, sm: 2 } }}>
      <Stack spacing={2}>
        {canEdit ? (
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h1" component="h1" align="center" gutterBottom>
            Медиа
          </Typography>
          <Stack
            spacing={2}
            sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'flex-end' },
              maxWidth: 560,
              mx: 'auto',
              mt: 2,
            }}
          >
            <TextField
              label="Подпись к следующей загрузке"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              fullWidth
              size="small"
              disabled={uploading}
            />
            <TextField
              label="Год съёмки (необязательно)"
              value={uploadTakenYear}
              onChange={(e) => setUploadTakenYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              fullWidth
              size="small"
              disabled={uploading}
              placeholder="Например, 1998"
              slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' } }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              hidden
              onChange={(e) => void handleFilesSelected(e.target.files)}
            />
            <Button
              variant="contained"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              sx={{ flexShrink: 0 }}
            >
              {uploading ? 'Загрузка…' : 'Выбрать фото'}
            </Button>
          </Stack>
         </Paper>
        ) : null}
        {loading && <SessionLoading message="Загружаем медиатеку…" />}
        {error && (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        )}

        {!loading && photos.length === 0 && !error && (
          <Typography color="text.secondary" align="center">
            {canEdit ? 'Пока нет фотографий — загрузите первую.' : 'Пока нет фотографий.'}
          </Typography>
        )}

        {!loading && photos.length > 0 && !error && (
          <Paper elevation={1} sx={{ p: 1.5, maxWidth: 360, mx: 'auto' }}>
            <FormControl fullWidth size="small">
              <InputLabel id="media-year-filter-label">Год съёмки</InputLabel>
              <Select
                labelId="media-year-filter-label"
                label="Год съёмки"
                value={
                  yearFilter === 'all' ? 'all' : yearFilter === 'none' ? 'none' : String(yearFilter)
                }
                onChange={(e) => {
                  const v = e.target.value as string;
                  if (v === 'all') {
                    setYearFilter('all');
                  } else if (v === 'none') {
                    setYearFilter('none');
                  } else {
                    setYearFilter(Number.parseInt(v, 10));
                  }
                }}
              >
                <MenuItem value="all">Все годы</MenuItem>
                {hasPhotosWithoutYear && <MenuItem value="none">Год не указан</MenuItem>}
                {takenYearsInGallery.map((y) => (
                  <MenuItem key={y} value={String(y)}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        )}

        {!loading && photos.length > 0 && filteredPhotos.length === 0 && !error && (
          <Typography color="text.secondary" align="center">
            Нет фотографий, подходящих под выбранный фильтр.
          </Typography>
        )}

        <GalleryPhotoMasonry
          photos={filteredPhotos}
          cols={galleryCols}
          gap={12}
          sx={{ width: '100%' }}
          onLoadMore={loadMore}
          hasMore={hasMoreGalleryPhotos}
          loadingMore={loadingMore}
          menuIdPrefix="media-gallery-photo"
          currentUserId={user?.id}
          onGalleryPhotoCommentsCountChange={(photoId, commentsCount) => {
            setPhotos((prev) =>
              prev.map((p) => (p.id === photoId ? { ...p, comments_count: commentsCount } : p)),
            );
          }}
          onEdit={
            canEdit
              ? (item) => {
                  setEditPhoto(item as GalleryPhoto);
                  setEditCaption(item.caption ?? '');
                  setEditTakenYear(
                    item.taken_year != null && !Number.isNaN(item.taken_year)
                      ? String(item.taken_year)
                      : '',
                  );
                  setEditFile(null);
                  setEditError(null);
                  if (editFileInputRef.current) {
                    editFileInputRef.current.value = '';
                  }
                }
              : undefined
          }
          onTagPeople={
            canEdit
              ? (item) => {
                  setTagPhoto(item as GalleryPhoto);
                  setTagError(null);
                }
              : undefined
          }
          onDelete={canEdit ? (photoId) => void handleDelete(photoId) : undefined}
        />
      </Stack>

      <GalleryPhotoTagPeopleDialog
        photo={tagPhoto}
        chartPeople={chartPeople}
        open={Boolean(tagPhoto)}
        saving={tagSaving}
        error={tagError}
        onClose={closeTagDialog}
        onSave={handleSaveTags}
      />

      <Dialog open={Boolean(editPhoto)} onClose={() => !editSaving && closeEditDialog()} fullWidth maxWidth="sm">
        <DialogTitle>Редактировать фото</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Подпись"
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              disabled={editSaving}
            />
            <TextField
              label="Год съёмки"
              value={editTakenYear}
              onChange={(e) => setEditTakenYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              fullWidth
              size="small"
              disabled={editSaving}
              placeholder="Оставьте пустым, если неизвестен"
              slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' } }}
            />
            <input
              ref={editFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => {
                const f = e.target.files?.item(0);
                setEditFile(f ?? null);
              }}
            />
            <Button
              variant="outlined"
              size="small"
              disabled={editSaving}
              onClick={() => editFileInputRef.current?.click()}
            >
              {editFile ? `Новый файл: ${editFile.name}` : 'Заменить изображение (необязательно)'}
            </Button>
            {editError && (
              <Alert severity="error" role="alert">
                {editError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => !editSaving && closeEditDialog()} disabled={editSaving}>
            Отмена
          </Button>
          <Button variant="contained" onClick={() => void handleSaveEdit()} disabled={editSaving}>
            {editSaving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
