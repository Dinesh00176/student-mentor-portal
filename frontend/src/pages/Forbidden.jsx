import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-5)', textAlign: 'center' }}>
      <h1>Access restricted</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>You don't have permission to view this page.</p>
      <Link to="/login">Return to login</Link>
    </div>
  );
}
