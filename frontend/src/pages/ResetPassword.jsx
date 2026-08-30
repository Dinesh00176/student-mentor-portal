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
        <div className="auth-card__brand">Reset Password</div>
        <p className="auth-card__tagline">Set a new password for your account.</p>

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Reset Token" htmlFor="token" required>
            <Input id="token" required value={token} onChange={(e) => setToken(e.target.value)} />
          </Field>
          <Field label="New Password" htmlFor="newPassword" required hint="At least 8 characters.">
            <Input id="newPassword" type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <Field label="Confirm New Password" htmlFor="confirmPassword" required>
            <Input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Field>
          {error && <p role="alert" style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>{error}</p>}
          <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Resetting…' : 'Reset Password'}
          </Button>
        </form>
        <p style={{ marginTop: 'var(--space-4)', fontSize: '0.85rem', textAlign: 'center' }}>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
