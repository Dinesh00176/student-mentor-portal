import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';
import { Field, Input } from '../components/FormField';
import Button from '../components/Button';
import { Link } from 'react-router-dom';
import '../layouts/AuthLayout.css';

const ROLE_HOME = {
  admin: '/admin/dashboard',
  mentor: '/mentor/dashboard',
  counselor: '/counselor/dashboard',
  student: '/student/dashboard',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(ROLE_HOME[user.role] || '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-card__brand">MentorPath</div>
        <p className="auth-card__tagline">Student mentoring &amp; counseling, in one place.</p>

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && <p role="alert" style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>{error}</p>}
          <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p style={{ marginTop: 'var(--space-4)', fontSize: '0.85rem', textAlign: 'center' }}>
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
      </div>
    </div>
  );
}
