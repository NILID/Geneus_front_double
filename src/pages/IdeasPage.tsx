import React, { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  MAX_BODY,
  MAX_COMMENT_BODY,
  createIdea,
  createIdeaComment,
  fetchIdeaComments,
  fetchIdeas,
  type Idea,
  type IdeaComment,
} from '../api/ideaApi';
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

function CommentCountBadge({ count }: { count: number }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        flexShrink: 0,
        pt: 0.25,
        color: 'text.secondary',
      }}
      aria-label={`Комментариев: ${count}`}
    >
      <SvgIcon fontSize="small" viewBox="0 0 24 24" aria-hidden>
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h10v2H7V9zm0-3h10v2H7V6zm0 6h7v2H7v-2z" />
      </SvgIcon>
      <Typography component="span" variant="caption" sx={{ fontWeight: 600, lineHeight: 1 }}>
        {count}
      </Typography>
    </Box>
  );
}

export function IdeasPage() {
  const { user, loading: authLoading } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [dialogIdea, setDialogIdea] = useState<Idea | null>(null);
  const [dialogComments, setDialogComments] = useState<IdeaComment[]>([]);
  const [dialogCommentsLoading, setDialogCommentsLoading] = useState(false);
  const [dialogCommentsError, setDialogCommentsError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentFormError, setCommentFormError] = useState<string | null>(null);

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

  const dialogIdeaId = dialogIdea?.id;

  useEffect(() => {
    if (dialogIdeaId == null) {
      setDialogComments([]);
      setDialogCommentsError(null);
      setDialogCommentsLoading(false);
      setCommentBody('');
      setCommentFormError(null);
      return;
    }
    let cancelled = false;
    setDialogCommentsLoading(true);
    setDialogCommentsError(null);
    fetchIdeaComments(dialogIdeaId)
      .then((list) => {
        if (!cancelled) {
          setDialogComments(list);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setDialogCommentsError(
            e instanceof Error ? e.message : 'Не удалось загрузить комментарии',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDialogCommentsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dialogIdeaId]);

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

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dialogIdea) {
      return;
    }
    setCommentFormError(null);
    const text = commentBody.trim();
    if (!text) {
      setCommentFormError('Введите текст комментария.');
      return;
    }
    const ideaId = dialogIdea.id;
    setCommentSubmitting(true);
    try {
      const { comment, comments_count } = await createIdeaComment(ideaId, text);
      setCommentBody('');
      setDialogComments((prev) => [...prev, comment]);
      setIdeas((prev) => prev.map((i) => (i.id === ideaId ? { ...i, comments_count } : i)));
      setDialogIdea((prev) => (prev && prev.id === ideaId ? { ...prev, comments_count } : prev));
    } catch (err: unknown) {
      setCommentFormError(err instanceof Error ? err.message : 'Не удалось отправить');
    } finally {
      setCommentSubmitting(false);
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
              <Paper
                key={idea.id}
                variant="outlined"
                role="button"
                tabIndex={0}
                onClick={() => setDialogIdea(idea)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDialogIdea(idea);
                  }
                }}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  transition: (theme) => theme.transitions.create('background-color', { duration: 120 }),
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:focus-visible': { outline: (theme) => `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
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
                  </Box>
                  <CommentCountBadge count={idea.comments_count} />
                </Box>
              </Paper>
            ))}
          </Stack>
        )}

        <Dialog
          open={dialogIdea != null}
          onClose={() => setDialogIdea(null)}
          maxWidth="md"
          fullWidth
          scroll="paper"
          aria-labelledby="idea-dialog-title"
        >
          <DialogTitle id="idea-dialog-title">Идея</DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            {dialogIdea ? (
              <Stack spacing={2}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {`${formatIdeaDate(dialogIdea.created_at)}${
                    dialogIdea.author_email ? ` · ${dialogIdea.author_email}` : ''
                  }${user && dialogIdea.user_id === user.id ? ' · вы' : ''}`}
                </Typography>
                <Typography
                  variant="body1"
                  component="div"
                  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {dialogIdea.body}
                </Typography>

                <Divider />

                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Комментарии
                </Typography>

                {dialogCommentsLoading ? (
                  <Typography variant="body2" color="text.secondary">
                    Загрузка комментариев…
                  </Typography>
                ) : dialogCommentsError ? (
                  <Alert severity="error">{dialogCommentsError}</Alert>
                ) : dialogComments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Пока нет комментариев.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {dialogComments.map((c) => (
                      <Paper key={c.id} variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          {`${formatIdeaDate(c.created_at)}${
                            c.author_email ? ` · ${c.author_email}` : ''
                          }${user && c.user_id === user.id ? ' · вы' : ''}`}
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

                <Box
                  component="form"
                  onSubmit={(ev) => void handleCommentSubmit(ev)}
                  sx={{ pt: 1 }}
                >
                  <Stack spacing={1.5}>
                    {commentFormError ? <Alert severity="error">{commentFormError}</Alert> : null}
                    <TextField
                      label="Новый комментарий"
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      fullWidth
                      multiline
                      minRows={3}
                      size="small"
                      slotProps={{ htmlInput: { maxLength: MAX_COMMENT_BODY } }}
                      helperText={`${commentBody.length} / ${MAX_COMMENT_BODY}`}
                    />
                    <Button type="submit" variant="contained" size="small" disabled={commentSubmitting}>
                      {commentSubmitting ? 'Отправка…' : 'Отправить комментарий'}
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogIdea(null)}>Закрыть</Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
}
