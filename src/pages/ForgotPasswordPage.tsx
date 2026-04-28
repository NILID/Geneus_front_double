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
          Reset password
        </Typography>
        {done ? (
          <Alert severity="info">
            If that email exists in our system, you will receive reset instructions shortly. You
            can close this tab or return to{' '}
            <Link component={RouterLink} to="/login">
              sign in
            </Link>
            .
          </Alert>
        ) : (
          <Box component="form" onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Enter your account email. We will send a link with a reset token (check your mailer
                configuration in development).
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
                {busy ? 'Sending…' : 'Send reset instructions'}
              </Button>
            </Stack>
          </Box>
        )}
        <Typography align="center" sx={{ mt: 3 }}>
          <Link component={RouterLink} to="/login" variant="body2">
            Back to sign in
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}
