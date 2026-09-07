import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';
import { Field, Input } from '../components/FormField';
import Button from '../components/Button';
import '../layouts/AuthLayout.css';

const ROLE_HOME = {
  admin: '/admin/dashboard',
  mentor: '/mentor/dashboard',
  counselor: '/counselor/dashboard',
  student: '/student/dashboard',
};

const DEMO_ACCOUNTS = [
  { role: 'Admin', name: 'Priya Raman', email: 'admin@campus.edu', pass: 'Admin@123' },
  { role: 'Mentor', name: 'Dr. Arvind Menon', email: 'arvind.mentor@campus.edu', pass: 'Mentor@123' },
  { role: 'Counselor', name: 'Ms. Divya Shankar', email: 'divya.counselor@campus.edu', pass: 'Counselor@123' },
  { role: 'Student', name: 'Rahul Krishnan', email: 'cse2023002@campus.edu', pass: 'Student@123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const doLogin = async (loginEmail, loginPassword) => {
    setError('');
    setSubmitting(true);
    try {
      const user = await login(loginEmail, loginPassword);
      navigate(ROLE_HOME[user.role] || '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  const handleDemoClick = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    doLogin(acc.email, acc.pass);
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-card__brand-wrap">
          <div className="auth-card__logo" aria-hidden="true">MP</div>
          <h1 className="auth-card__brand">MentorPath</h1>
        </div>
        <p className="auth-card__tagline">Centralized Student Mentoring &amp; Counseling Platform</p>

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Institutional Email" htmlFor="email" required error={error ? '' : undefined}>
            <Input
              id="email"
              type="email"
              placeholder="e.g. name@campus.edu"
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
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            Sign In to Portal
          </Button>
        </form>

        <div className="auth-card__links">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        {/* Demo Fast Logins for Testing */}
        <div className="auth-card__demo-pills">
          <div className="auth-card__demo-title">Quick Demo 1-Click Login</div>
          <div className="auth-card__demo-buttons">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                className="auth-card__demo-btn"
                title={`${acc.name} (${acc.email})`}
                disabled={submitting}
                onClick={() => handleDemoClick(acc)}
              >
                {acc.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
