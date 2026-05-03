import React, { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { MAX_BODY, createIdea, fetchIdeas, type Idea } from '../api/ideaApi';
import { SessionLoading } from '../components/SessionLoading';
import { useAuth } from '../auth/AuthContext';

function formatIdeaDate(iso: string): string {
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

export function IdeasPage() {
  const { user, loading: authLoading } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return fetchIdeas()
      .then(setIdeas)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Не удалось загрузить идеи');
      });
  }, []);

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
    const b = body.trim();
    if (!b) {
      setFormError('Напишите текст идеи.');
      return;
    }
    setSubmitting(true);
    try {
      await createIdea(b);
      setBody('');
      await load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return <SessionLoading />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Идеи
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Предлагайте новый функционал, улучшения или сообщения об ошибках. Идеи видны всем
            авторизованным пользователям, от новых к старым.
          </Typography>
        </Box>

        <Paper
          component="form"
          variant="outlined"
          onSubmit={(ev) => void handleSubmit(ev)}
          sx={{ p: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Новая идея
          </Typography>
          <Stack spacing={2}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <TextField
              label="Текст идеи"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              fullWidth
              multiline
              minRows={5}
              slotProps={{ htmlInput: { maxLength: MAX_BODY } }}
              helperText={`${body.length} / ${MAX_BODY}`}
            />
            <Box>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Отправка…' : 'Опубликовать'}
              </Button>
            </Box>
          </Stack>
        </Paper>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Typography color="text.secondary">Загрузка…</Typography>
        ) : ideas.length === 0 ? (
          <Typography color="text.secondary">Пока нет ни одной идеи.</Typography>
        ) : (
          <Stack spacing={2}>
            {ideas.map((idea) => (
              <Paper key={idea.id} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  {`${formatIdeaDate(idea.created_at)}${
                    idea.author_email ? ` · ${idea.author_email}` : ''
                  }${user && idea.user_id === user.id ? ' · вы' : ''}`}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {idea.body}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
