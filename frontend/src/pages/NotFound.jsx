import { Link } from 'react-router-dom';
import Button from '../components/Button';

export default function NotFound() {
  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-5)', display: 'flex', justifyContent: 'center' }}>
      <div className="record-card" style={{ maxWidth: 480, textAlign: 'center', padding: 'var(--space-7) var(--space-6)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }} aria-hidden="true">🧭</div>
        <h1 style={{ fontSize: '1.4rem' }}>Page Not Found</h1>
        <p style={{ color: 'var(--color-ink-muted)', marginBottom: 'var(--space-5)' }}>
          The page you requested could not be found or has been moved.
        </p>
        <Button as={Link} to="/" variant="secondary">
          Return to Portal
        </Button>
      </div>
    </div>
  );
}
