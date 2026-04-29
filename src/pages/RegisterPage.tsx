import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register(email.trim(), password, passwordConfirmation);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h1" component="h1" gutterBottom align="center">
          Создание аккаунта
        </Typography>
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Пароль"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { minLength: 6 } }}
              helperText="Не менее 6 символов"
            />
            <TextField
              label="Повторите пароль"
              type="password"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(ev) => setPasswordConfirmation(ev.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { minLength: 6 } }}
            />
            {error && (
              <Alert severity="error" role="alert">
                {error}
              </Alert>
            )}
            <Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
              {busy ? 'Создание…' : 'Зарегистрироваться'}
            </Button>
          </Stack>
        </Box>
        <Typography align="center" sx={{ mt: 3 }}>
          <Link component={RouterLink} to="/login" variant="body2">
            Уже есть аккаунт? Войти
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}
