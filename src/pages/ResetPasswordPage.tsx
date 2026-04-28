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
import { resetPasswordRequest } from '../auth/authApi';

export function ResetPasswordPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromQuery = useMemo(() => search.get('reset_password_token') ?? '', [search]);

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
      await resetPasswordRequest(token.trim(), password, passwordConfirmation);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h1" component="h1" gutterBottom align="center">
          Set new password
        </Typography>
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Reset token"
              value={token}
              onChange={(ev) => setToken(ev.target.value)}
              required
              fullWidth
              placeholder="Paste token from email"
              autoComplete="off"
            />
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { minLength: 6 } }}
            />
            <TextField
              label="Confirm password"
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
              {busy ? 'Saving…' : 'Update password'}
            </Button>
          </Stack>
        </Box>
        <Typography align="center" sx={{ mt: 3 }}>
          <Link component={RouterLink} to="/login" variant="body2">
            Back to sign in
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}
