import React, { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { acceptInvitationRequest } from '../auth/authApi';
import { useAuth } from '../auth/AuthContext';

export function AcceptInvitationPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const tokenFromQuery = useMemo(() => search.get('invitation_token') ?? '', [search]);

  const [token, setToken] = useState(tokenFromQuery);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await acceptInvitationRequest(token.trim(), password, passwordConfirmation);
      await refreshUser();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось принять приглашение');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h1" component="h1" gutterBottom align="center">
          Приглашение
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          Задайте пароль для входа в аккаунт.
        </Typography>
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Код приглашения"
              value={token}
              onChange={(ev) => setToken(ev.target.value)}
              required
              fullWidth
              placeholder="Из письма или из ссылки"
              autoComplete="off"
            />
            <TextField
              label="Пароль"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { minLength: 8 } }}
              helperText="Не менее 8 символов, заглавная латинская буква и спецсимвол"
            />
            <TextField
              label="Повторите пароль"
              type="password"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(ev) => setPasswordConfirmation(ev.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { minLength: 8 } }}
            />
            {error && (
              <Alert severity="error" role="alert">
                {error}
              </Alert>
            )}
            <Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
              {busy ? 'Сохранение…' : 'Создать аккаунт'}
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
