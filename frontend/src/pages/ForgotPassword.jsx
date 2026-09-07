import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/auth.service';
import { getErrorMessage } from '../services/api';
import { Field, Input } from '../components/FormField';
import Button from '../components/Button';
import '../layouts/AuthLayout.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await forgotPassword(email);
      setMessage(data.message);
      if (data.data?.resetToken) setDevToken(data.data.resetToken);
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
          <h1 className="auth-card__brand">Forgot Password</h1>
        </div>
        <p className="auth-card__tagline">Enter your institutional email to request a reset link.</p>

        {!message ? (
          <form onSubmit={handleSubmit} noValidate>
            <Field label="Institutional Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                placeholder="e.g. name@college.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              Send Password Reset Link
            </Button>
          </form>
        ) : (
          <div>
            <div style={{ padding: '12px 14px', background: 'var(--color-stable-tint)', border: '1px solid var(--color-stable-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-stable-strong)', fontSize: '0.88rem', marginBottom: 'var(--space-4)' }}>
              {message}
            </div>

            {devToken && (
              <div className="record-card" style={{ marginTop: 'var(--space-3)', borderLeft: '3px solid var(--color-accent)' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-faint)', marginBottom: 6 }}>
                  (Dev-mode demo token returned by server):
                </p>
                <code style={{ wordBreak: 'break-all', fontSize: '0.8rem', background: 'var(--color-surface-sunken)', padding: '4px 8px', borderRadius: 'var(--radius-xs)', display: 'block' }}>
                  {devToken}
                </code>
                <p style={{ marginTop: 'var(--space-3)', marginBottom: 0 }}>
                  <Link to={`/reset-password?token=${devToken}`}>→ Continue to reset password</Link>
                </p>
              </div>
            )}
          </div>
        )}

        <div className="auth-card__links">
          <Link to="/login">← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
