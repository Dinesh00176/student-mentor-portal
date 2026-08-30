import './States.css';

export default function Skeleton({ rows = 3, height = 16 }) {
  return (
    <div aria-hidden="true" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-line" style={{ height, width: `${92 - i * 8}%` }} />
      ))}
    </div>
  );
}
