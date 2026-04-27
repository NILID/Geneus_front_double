import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
    <div className="auth-page">
      <h1>Set new password</h1>
      <form className="auth-form" onSubmit={onSubmit}>
        <label className="auth-field">
          <span>Reset token</span>
          <input
            type="text"
            autoComplete="off"
            value={token}
            onChange={(ev) => setToken(ev.target.value)}
            required
            placeholder="Paste token from email"
          />
        </label>
        <label className="auth-field">
          <span>New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            minLength={6}
          />
        </label>
        <label className="auth-field">
          <span>Confirm password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(ev) => setPasswordConfirmation(ev.target.value)}
            required
            minLength={6}
          />
        </label>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="auth-submit" disabled={busy}>
          {busy ? 'Saving…' : 'Update password'}
        </button>
      </form>
      <p className="auth-links">
        <Link to="/login">Back to sign in</Link>
      </p>
    </div>
  );
}
