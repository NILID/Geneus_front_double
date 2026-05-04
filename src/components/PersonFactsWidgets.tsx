import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { createPersonFact, type PersonFact } from '../api/personFactsApi';

const FACTS_PAGE_SIZE = 3;

function formatFactWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function AddPersonFactForm({
  personId,
  onAdded,
}: {
  personId: string;
  onAdded: () => void | Promise<void>;
}) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = body.trim();
    if (!t) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createPersonFact(personId, t);
      setBody('');
      await onAdded();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 0 }}>
      <TextField
        label="Добавить факт"
        placeholder="Коротко опишите известное о персоне…"
        value={body}
        onChange={(ev) => setBody(ev.target.value)}
        multiline
        minRows={2}
        fullWidth
        disabled={submitting}
        slotProps={{ htmlInput: { maxLength: 5000 } }}
        helperText={`${body.length} / 5000`}
      />
      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
      <Button type="submit" variant="contained" sx={{ mt: 1 }} disabled={submitting || !body.trim()}>
        Опубликовать
      </Button>
    </Box>
  );
}

export function PersonFactsPeekList({
  facts,
  personId,
}: {
  facts: PersonFact[];
  personId: string;
}) {
  const [visible, setVisible] = useState(FACTS_PAGE_SIZE);

  useEffect(() => {
    setVisible(FACTS_PAGE_SIZE);
  }, [personId]);

  const ordered = useMemo(() => {
    return [...facts].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return tb - ta;
    });
  }, [facts]);

  const shown = ordered.slice(0, visible);
  const hasMore = visible < ordered.length;

  const authorLine = (email: string | null) =>
    email != null && email.trim() !== '' ? `от ${email.trim()}` : 'от участника';

  return (
    <Box>
      <List sx={{ py: 0 }}>
        {shown.map((f, idx) => (
          <React.Fragment key={f.id}>
            {idx > 0 ? <Divider component="li" variant="fullWidth" sx={{ my: 0 }} /> : null}
            <ListItem alignItems="flex-start" sx={{ py: 1.25, px: 0 }}>
              <ListItemText
                primary={f.body}
                secondary={authorLine(f.author_email)}
                slotProps={{
                  primary: {
                    variant: 'body2',
                    sx: { whiteSpace: 'pre-wrap' },
                  },
                  secondary: {
                    variant: 'caption',
                    color: 'text.secondary',
                    sx: { mt: 0.75, display: 'block' },
                  },
                }}
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
      {hasMore ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            type="button"
            variant="text"
            size="small"
            onClick={() => setVisible((v) => v + FACTS_PAGE_SIZE)}
          >
            Показать ещё
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}

export function PersonFactsHeading({
  personId,
  subtitle,
}: {
  personId: string;
  subtitle?: boolean;
}) {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h2" component="h2" gutterBottom>
        <Link
          component={RouterLink}
          to={`/person/${encodeURIComponent(personId)}/facts`}
          underline="hover"
          color="inherit"
        >
          Факты
        </Link>
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          Показаны три последних. Нажмите заголовок, чтобы открыть все.
        </Typography>
      )}
    </Box>
  );
}

export function PersonFactsList({ facts }: { facts: PersonFact[] }) {
  if (facts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Пока нет фактов — добавьте первый ниже.
      </Typography>
    );
  }
  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {facts.map((f) => (
        <Paper key={f.id} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {f.body}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {`${f.author_email ?? 'участник'} · ${formatFactWhen(f.created_at)}`}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}
