import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { sendAdminDigest, type AdminDigestSendResult } from '../api/adminDigestApi';

function formatPeriod(iso: string): string {
  if (!iso) {
    return '—';
  }
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function AdminDigestPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdminDigestSendResult | null>(null);

  async function sendNow() {
    setSending(true);
    setError(null);
    try {
      const next = await sendAdminDigest();
      setResult(next);
      setConfirmOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить дайджест');
    } finally {
      setSending(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 700 }}>
          Дайджест
        </Typography>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={1.5}>
            <Typography variant="body1">
              Кнопка ниже отправит дайджест только вам: обновления за последний месяц и дни рождения на месяц
              вперёд. Пустые разделы в письме скрываются, сводка с цифрами остаётся сверху.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Всем зарегистрированным пользователям то же письмо уходит автоматически 1-го числа каждого месяца.
            </Typography>
            <Stack direction="row" sx={{ pt: 1 }}>
              <Button variant="contained" onClick={() => setConfirmOpen(true)} disabled={sending}>
                Отправить сейчас
              </Button>
            </Stack>
          </Stack>
        </Paper>
        {error && (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        )}
        {result && (
          <Alert severity="success" role="status">
            Отправлено писем: {result.sent}
            {result.recipients.length > 0 ? ` (${result.recipients.join(', ')})` : ''}. Период:{' '}
            {formatPeriod(result.period.from)} — {formatPeriod(result.period.to)}. В дайджесте: дни рождения{' '}
            {result.counts.birthdays}, новые персоны {result.counts.new_people}, изменения{' '}
            {result.counts.updated_people}, фото {result.counts.photos}, отметки {result.counts.photo_tags}, факты{' '}
            {result.counts.facts}.
          </Alert>
        )}
      </Stack>

      <Dialog open={confirmOpen} onClose={() => !sending && setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Отправить дайджест?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Письмо придёт только на ваш адрес, остальные пользователи его не получат.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={sending}>
            Отмена
          </Button>
          <Button variant="contained" onClick={() => void sendNow()} disabled={sending}>
            {sending ? 'Отправка…' : 'Отправить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
