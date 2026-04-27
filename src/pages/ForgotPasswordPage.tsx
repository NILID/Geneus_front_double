import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="auth-page">
      <h1>Reset password</h1>
      {done ? (
        <p className="auth-hint">
          If that email exists in our system, you will receive reset instructions shortly. You can
          close this tab or return to <Link to="/login">sign in</Link>.
        </p>
      ) : (
        <form className="auth-form" onSubmit={onSubmit}>
          <p className="auth-hint">
            Enter your account email. We will send a link with a reset token (check your mailer
            configuration in development).
          </p>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
            />
          </label>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset instructions'}
          </button>
        </form>
      )}
      <p className="auth-links">
        <Link to="/login">Back to sign in</Link>
      </p>
    </div>
  );
}
