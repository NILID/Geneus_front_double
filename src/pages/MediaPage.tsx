import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  deleteGalleryPhoto,
  fetchGalleryPhotos,
  updateGalleryPhoto,
  uploadGalleryPhoto,
  type GalleryPhoto,
} from '../api/galleryPhotoApi';
import { personDisplayName } from '../api/personApi';
import { useAuth } from '../auth/AuthContext';
import { SessionLoading } from '../components/SessionLoading';
import { chartPeopleAsTagOptions, fetchFamilyChart, type ChartPersonOption } from '../familyChartApi';

function GearIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fontSize="inherit">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.499.499 0 0 0-.59.22l-1.92 3.32c-.12.22-.07.47.12.61l2.03 1.58c-.05.31-.08.63-.08.94s.03.63.06.94l-2.03 1.58a.499.499 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </SvgIcon>
  );
}

function OwnerPhotoMenu({
  menuInstanceId,
  onEdit,
  onDelete,
}: {
  menuInstanceId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        sx={{ color: 'common.white' }}
        aria-label="Действия с фото"
        aria-controls={open ? menuInstanceId : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        size="small"
      >
        <GearIcon fontSize="small" />
      </IconButton>
      <Menu
        id={menuInstanceId}
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onEdit();
          }}
        >
          Редактировать
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete();
          }}
        >
          Удалить
        </MenuItem>
      </Menu>
    </>
  );
}

export function MediaPage() {
  const reactId = useId();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const galleryCols = isMdUp ? 3 : isSmUp ? 2 : 1;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editPhoto, setEditPhoto] = useState<GalleryPhoto | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editTagIds, setEditTagIds] = useState<number[]>([]);
  const [chartPeople, setChartPeople] = useState<ChartPersonOption[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return fetchGalleryPhotos()
      .then(setPhotos)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Не удалось загрузить галерею');
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchFamilyChart()
      .then((chart) => {
        if (!cancelled) {
          setChartPeople(chartPeopleAsTagOptions(chart));
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
    fetchGalleryPhotos()
      .then((list) => {
        if (!cancelled) {
          setPhotos(list);
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

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files?.length) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const caption = uploadCaption.trim() === '' ? null : uploadCaption.trim();
      const fileArr = Array.from(files);
      await Promise.all(
        fileArr.map((f, i) => uploadGalleryPhoto(f, i === 0 ? caption : null)),
      );
      setUploadCaption('');
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
    setEditFile(null);
    setEditTagIds([]);
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
      await updateGalleryPhoto(editPhoto.id, {
        caption: cap,
        image: editFile ?? undefined,
        person_ids: editTagIds,
      });
      await load();
      closeEditDialog();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2, px: { xs: 1, sm: 2 } }}>
      <Stack spacing={2}>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Stack
            spacing={2}
            sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <Button component={RouterLink} to="/" variant="text" size="small" color="inherit">
                Семейное древо
              </Button>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Stack>
            <Button variant="outlined" color="inherit" size="small" onClick={() => void handleLogout()}>
              Выйти
            </Button>
          </Stack>
          <Typography variant="h1" component="h1" align="center" sx={{ mt: 2 }} gutterBottom>
            Медиа
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Общая галерея: все вошедшие пользователи видят фотографии друг друга. Редактировать, отмечать
            персон и удалять можно только свои снимки (список персон для отметок берётся из семейного древа).
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

        {loading && <SessionLoading message="Загружаем медиатеку…" />}
        {error && (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        )}

        {!loading && photos.length === 0 && !error && (
          <Typography color="text.secondary" align="center">
            Пока нет фотографий — загрузите первую.
          </Typography>
        )}

        {photos.length > 0 && (
          <ImageList variant="masonry" cols={galleryCols} gap={12} sx={{ width: '100%', mb: 0 }}>
            {photos.map((item) => (
              <ImageListItem key={item.id} sx={{ overflow: 'hidden', borderRadius: 1 }}>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.caption ?? ''}
                    loading="lazy"
                    style={{ width: '100%', height: 'auto', display: 'block', verticalAlign: 'bottom' }}
                  />
                ) : (
                  <Box sx={{ minHeight: 120, bgcolor: 'action.hover' }} />
                )}
                <ImageListItemBar
                  title={item.caption?.trim() ? item.caption : 'Без подписи'}
                  subtitle={
                    [
                      item.uploaded_by_email ?? 'Неизвестно',
                      new Date(item.created_at).toLocaleString(),
                      item.tagged_people.length > 0
                        ? `На фото: ${item.tagged_people.map((p) => personDisplayName(p)).join(', ')}`
                        : '',
                    ]
                      .filter((s) => s !== '')
                      .join(' · ')
                  }
                  position="bottom"
                  actionIcon={
                    user && item.user_id === user.id ? (
                      <OwnerPhotoMenu
                        menuInstanceId={`gallery-photo-menu-${reactId}-${item.id}`}
                        onEdit={() => {
                          setEditPhoto(item);
                          setEditCaption(item.caption ?? '');
                          setEditFile(null);
                          setEditTagIds(item.tagged_people.map((p) => p.id));
                          setEditError(null);
                          if (editFileInputRef.current) {
                            editFileInputRef.current.value = '';
                          }
                        }}
                        onDelete={() => void handleDelete(item.id)}
                      />
                    ) : undefined
                  }
                  actionPosition="right"
                />
              </ImageListItem>
            ))}
          </ImageList>
        )}
      </Stack>

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
            <Autocomplete
              multiple
              options={chartPeople}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={chartPeople.filter((o) => editTagIds.includes(o.id))}
              onChange={(_, v) => setEditTagIds(v.map((o) => o.id))}
              disabled={editSaving}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Отмеченные на фото персоны"
                  placeholder={chartPeople.length ? 'Выберите из древа' : 'Загрузите древо или откройте позже'}
                />
              )}
            />
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
