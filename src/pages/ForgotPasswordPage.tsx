import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { requestPasswordReset } from '../auth/authApi';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h1" component="h1" gutterBottom align="center">
          Сброс пароля
        </Typography>
        {done ? (
          <Alert severity="info">
            Если такой адрес электронной почты существует в нашей системе, вы получите инструкцию
            <Link component={RouterLink} to="/login">
              Войти
            </Link>
            .
          </Alert>
        ) : (
          <Box component="form" onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Введите адрес электронной почты, который вы использовали для регистрации.
                Мы отправим вам ссылку для сброса пароля.
              </Typography>
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
                fullWidth
              />
              {error && (
                <Alert severity="error" role="alert">
                  {error}
                </Alert>
              )}
              <Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
                {busy ? 'Отправка…' : 'Отправить письмо для сброса'}
              </Button>
            </Stack>
          </Box>
        )}
        <Typography align="center" sx={{ mt: 3 }}>
          <Link component={RouterLink} to="/login" variant="body2">
            Вернуться к странице входа
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}
