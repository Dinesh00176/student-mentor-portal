import './StatCard.css';

export default function StatCard({ label, value, hint, tone = 'neutral', icon = null, trend = null }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
        {icon && <span className="stat-card__icon" aria-hidden="true">{icon}</span>}
      </div>
      <div className="stat-card__value tabular-nums">{value}</div>
      {(hint || trend) && (
        <div className="stat-card__footer">
          {trend && <span className={`stat-card__trend stat-card__trend--${trend.type || 'neutral'}`}>{trend.label}</span>}
          {hint && <span className="stat-card__hint">{hint}</span>}
        </div>
      )}
    </div>
  );
}
