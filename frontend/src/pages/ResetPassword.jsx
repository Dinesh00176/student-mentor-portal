import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/auth.service';
import { getErrorMessage } from '../services/api';
import { Field, Input } from '../components/FormField';
import Button from '../components/Button';
import '../layouts/AuthLayout.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-card__brand-wrap">
          <div className="auth-card__logo" aria-hidden="true">MP</div>
          <h1 className="auth-card__brand">Reset Password</h1>
        </div>
        <p className="auth-card__tagline">Set a secure new password for your account.</p>

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Reset Token" htmlFor="token" required>
            <Input
              id="token"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token if not filled"
            />
          </Field>
          <Field label="New Password" htmlFor="newPassword" required hint="Must be at least 8 characters long.">
            <Input
              id="newPassword"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Confirm New Password" htmlFor="confirmPassword" required>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && (
            <div
              role="alert"
              style={{
                color: 'var(--color-critical)',
                fontSize: '0.84rem',
                marginBottom: 'var(--space-4)',
                padding: '8px 12px',
                background: 'var(--color-critical-tint)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-critical-border)',
              }}
            >
              {error}
            </div>
          )}

          <Button type="submit" loading={submitting} fullWidth size="lg">
            Save New Password &amp; Sign In
          </Button>
        </form>

        <div className="auth-card__links">
          <Link to="/login">← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
