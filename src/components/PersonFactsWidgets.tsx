import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import MobileStepper from '@mui/material/MobileStepper';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { createPersonFact, type PersonFact } from '../api/personFactsApi';

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
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
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

export function PersonFactsCarousel({ facts }: { facts: PersonFact[] }) {
  const [active, setActive] = useState(0);

  if (facts.length === 0) {
    return null;
  }

  const current = facts[Math.min(active, facts.length - 1)];

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'action.hover' }}>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', minHeight: 72 }}>
        {current.body}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {`${current.author_email ?? 'участник'} · ${formatFactWhen(current.created_at)}`}
      </Typography>
      {facts.length > 1 && (
        <MobileStepper
          variant="dots"
          steps={facts.length}
          position="static"
          activeStep={active}
          sx={{ mt: 1, bgcolor: 'transparent', justifyContent: 'center' }}
          nextButton={
            <Button
              size="small"
              onClick={() => setActive((i) => Math.min(i + 1, facts.length - 1))}
              disabled={active >= facts.length - 1}
            >
              Далее
            </Button>
          }
          backButton={
            <Button size="small" onClick={() => setActive((i) => Math.max(i - 1, 0))} disabled={active <= 0}>
              Назад
            </Button>
          }
        />
      )}
    </Paper>
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
