import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-5)', textAlign: 'center' }}>
      <h1>Page not found</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>The page you're looking for doesn't exist.</p>
      <Link to="/login">Return to login</Link>
    </div>
  );
}
