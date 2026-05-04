import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h1" component="h1" gutterBottom align="center">
          Вход
        </Typography>
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Пароль"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              fullWidth
            />
            {error && (
              <Alert severity="error" role="alert">
                {error}
              </Alert>
            )}
            <Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
              {busy ? 'Выполняется вход…' : 'Войти'}
            </Button>
          </Stack>
        </Box>
        <Stack spacing={1.5} sx={{ mt: 3, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Новый аккаунт — только по приглашению. Если вам уже отправили ссылку, откройте{' '}
            <Link component={RouterLink} to="/accept-invitation">
              страницу приглашения
            </Link>
            .
          </Typography>
          <Link component={RouterLink} to="/forgot-password" variant="body2">
            Забыли пароль?
          </Link>
        </Stack>
      </Paper>
    </Container>
  );
}
