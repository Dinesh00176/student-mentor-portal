import './States.css';

export default function Skeleton({ rows = 3, height = 18, variant = 'line', className = '' }) {
  if (variant === 'card') {
    return (
      <div className={`skeleton-card ${className}`} aria-hidden="true" aria-busy="true">
        <div className="skeleton-line skeleton-line--heading" style={{ height: 24, width: '45%' }} />
        <div className="skeleton-line" style={{ height: 16, width: '90%' }} />
        <div className="skeleton-line" style={{ height: 16, width: '75%' }} />
      </div>
    );
  }

  return (
    <div className={`skeleton-wrap ${className}`} aria-hidden="true" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{
            height,
            width: rows === 1 ? '100%' : `${95 - ((i % 4) * 12)}%`,
          }}
        />
      ))}
    </div>
  );
}
