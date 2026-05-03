import React, { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  MAX_COMMENT_BODY,
  createGalleryPhotoComment,
  fetchGalleryPhotoComments,
  type GalleryPhotoComment,
} from '../api/galleryPhotoApi';

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

export interface GalleryPhotoFancyboxCommentsProps {
  photoId: number;
  currentUserId?: number | null;
  onCommentsCountChange?: (photoId: number, commentsCount: number) => void;
}

export function GalleryPhotoFancyboxComments({
  photoId,
  currentUserId,
  onCommentsCountChange,
}: GalleryPhotoFancyboxCommentsProps) {
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

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        maxHeight: '38vh',
        overflowY: 'auto',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Комментарии
      </Typography>

      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Загрузка…
        </Typography>
      ) : loadError ? (
        <Alert severity="error" sx={{ mb: 1 }}>
          {loadError}
        </Alert>
      ) : comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Пока нет комментариев.
        </Typography>
      ) : (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {comments.map((c) => (
            <Paper key={c.id} variant="outlined" sx={{ p: 1, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {`${formatWhen(c.created_at)}${c.author_email ? ` · ${c.author_email}` : ''}${
                  currentUserId != null && c.user_id === currentUserId ? ' · вы' : ''
                }`}
              </Typography>
              <Typography
                variant="body2"
                component="div"
                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {c.body}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}

      <Box component="form" onSubmit={(ev) => void handleSubmit(ev)}>
        <Stack spacing={1}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField
            label="Новый комментарий"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            size="small"
            slotProps={{ htmlInput: { maxLength: MAX_COMMENT_BODY } }}
            helperText={`${draft.length} / ${MAX_COMMENT_BODY}`}
          />
          <Button type="submit" variant="contained" size="small" disabled={submitting}>
            {submitting ? 'Отправка…' : 'Отправить'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
