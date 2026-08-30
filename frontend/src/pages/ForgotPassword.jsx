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
      // Dev-mode only: the backend returns the raw reset token directly
      // because no email service is configured for this project. In a real
      // deployment this would be emailed, never shown in the UI.
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
        <div className="auth-card__brand">Forgot Password</div>
        <p className="auth-card__tagline">We'll help you get back into your account.</p>

        {!message ? (
          <form onSubmit={handleSubmit} noValidate>
            <Field label="Email" htmlFor="email" required>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {error && <p role="alert" style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>{error}</p>}
            <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <div>
            <p style={{ fontSize: '0.9rem' }}>{message}</p>
            {devToken && (
              <div className="record-card" style={{ marginTop: 'var(--space-3)' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-faint)', marginBottom: 6 }}>
                  No email service is configured, so for this demo the reset token is shown here directly:
                </p>
                <code style={{ wordBreak: 'break-all', fontSize: '0.8rem' }}>{devToken}</code>
                <p style={{ marginTop: 'var(--space-3)' }}>
                  <Link to={`/reset-password?token=${devToken}`}>Continue to reset password</Link>
                </p>
              </div>
            )}
          </div>
        )}

        <p style={{ marginTop: 'var(--space-4)', fontSize: '0.85rem', textAlign: 'center' }}>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
