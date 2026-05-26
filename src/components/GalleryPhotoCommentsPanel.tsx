import React, { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import {
  MAX_COMMENT_BODY,
  createGalleryPhotoComment,
  fetchGalleryPhotoComments,
  type GalleryPhotoComment,
} from '../api/galleryPhotoApi';

/** Максимум видимых строк черновика; дальше прокрутка внутри поля */
const DRAFT_MAX_ROWS = 6;

function formatWhen(iso: string): string {
  if (!iso) {
    return '';
  }
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export interface GalleryPhotoCommentsPanelProps {
  photoId: number;
  currentUserId?: number | null;
  onCommentsCountChange?: (photoId: number, commentsCount: number) => void;
  /** Дополнительные стили корневого контейнера (например, flex в боковой панели просмотра) */
  sx?: SxProps<Theme>;
  /** Тёмная панель в полноэкранном просмотре — контрастные поля и карточки комментариев */
  surface?: 'light' | 'dark';
  /** Скрыть заголовок «Комментарии» (заголовок в drawer) */
  hideTitle?: boolean;
}

export function GalleryPhotoCommentsPanel({
  photoId,
  currentUserId,
  onCommentsCountChange,
  sx: sxProp,
  surface = 'light',
  hideTitle = false,
}: GalleryPhotoCommentsPanelProps) {
  const [comments, setComments] = useState<GalleryPhotoComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    return fetchGalleryPhotoComments(photoId)
      .then(setComments)
      .catch((e: unknown) => {
        setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить комментарии');
      });
  }, [photoId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const text = draft.trim();
    if (!text) {
      setFormError('Введите текст комментария.');
      return;
    }
    setSubmitting(true);
    try {
      const { comment, comments_count } = await createGalleryPhotoComment(photoId, text);
      setDraft('');
      setComments((prev) => [...prev, comment]);
      onCommentsCountChange?.(photoId, comments_count);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Не удалось отправить');
    } finally {
      setSubmitting(false);
    }
  }

  const dark = surface === 'dark';

  const draftFieldSx = dark
    ? {
        '& .MuiOutlinedInput-root': {
          bgcolor: 'grey.800',
          color: 'grey.100',
        },
        '& .MuiInputLabel-root': { color: 'grey.500' },
        '& .MuiFormHelperText-root': { color: 'grey.600' },
      }
    : undefined;

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        maxHeight: dark ? undefined : '38vh',
        flex: dark ? '1 1 auto' : undefined,
        minHeight: dark ? 0 : undefined,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderTop: dark ? 0 : 1,
        borderColor: 'divider',
        bgcolor: dark ? 'transparent' : 'background.paper',
        color: dark ? 'grey.200' : undefined,
        ...sxProp,
      }}
    >
      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          pr: dark ? 0.5 : undefined,
        }}
      >
        {hideTitle ? null : (
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Комментарии
          </Typography>
        )}

        {loading ? (
          <Typography variant="body2" color={dark ? 'grey.400' : 'text.secondary'} sx={{ mb: 1 }}>
            Загрузка…
          </Typography>
        ) : loadError ? (
          <Alert severity="error" sx={{ mb: 1 }}>
            {loadError}
          </Alert>
        ) : comments.length === 0 ? (
          <Typography variant="body2" color={dark ? 'grey.500' : 'text.secondary'} sx={{ mb: 1 }}>
            Пока нет комментариев.
          </Typography>
        ) : (
          <Stack spacing={1} sx={{ mb: 1 }}>
            {comments.map((c) => (
              <Paper
                key={c.id}
                variant="outlined"
                sx={{
                  p: 1,
                  bgcolor: dark ? 'grey.800' : 'action.hover',
                  borderColor: dark ? 'grey.700' : undefined,
                }}
              >
                <Typography
                  variant="caption"
                  color={dark ? 'grey.500' : 'text.secondary'}
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  {`${formatWhen(c.created_at)}${c.author_email ? ` · ${c.author_email}` : ''}${
                    currentUserId != null && c.user_id === currentUserId ? ' · вы' : ''
                  }`}
                </Typography>
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: dark ? 'grey.100' : undefined }}
                >
                  {c.body}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <Box
        component="form"
        onSubmit={(ev) => void handleSubmit(ev)}
        sx={{
          flexShrink: 0,
          pt: 1,
          borderTop: 1,
          borderColor: dark ? 'grey.800' : 'divider',
        }}
      >
        <Stack spacing={1}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField
            label="Новый комментарий"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            maxRows={DRAFT_MAX_ROWS}
            size="small"
            slotProps={{ htmlInput: { maxLength: MAX_COMMENT_BODY } }}
            helperText={`${draft.length} / ${MAX_COMMENT_BODY}`}
            sx={draftFieldSx}
          />
          <Button type="submit" variant="contained" size="small" disabled={submitting}>
            {submitting ? 'Отправка…' : 'Отправить'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
