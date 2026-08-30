import './SimpleBarChart.css';

// Lightweight, dependency-free horizontal bar chart. Keeps dashboards
// readable without pulling in a charting library where a handful of
// labeled bars is all that's needed.
export default function SimpleBarChart({ data, title, valueFormatter = (v) => v }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="simple-bar-chart">
      {title && <h3 style={{ marginBottom: 'var(--space-3)' }}>{title}</h3>}
      <div className="simple-bar-chart__rows">
        {data.map((d) => (
          <div key={d.label} className="simple-bar-chart__row">
            <span className="simple-bar-chart__label">{d.label}</span>
            <div className="simple-bar-chart__track">
              <div
                className="simple-bar-chart__fill"
                style={{ width: `${(d.value / max) * 100}%`, background: d.color || 'var(--color-accent)' }}
              />
            </div>
            <span className="simple-bar-chart__value">{valueFormatter(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
