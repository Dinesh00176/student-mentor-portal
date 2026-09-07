import './SimpleBarChart.css';

export default function SimpleBarChart({
  data = [],
  title,
  subtitle,
  valueFormatter = (v) => v,
  showPercentage = false,
}) {
  const total = data.reduce((acc, d) => acc + (d.value || 0), 0);
  const max = Math.max(...data.map((d) => d.value || 0), 1);

  return (
    <div className="simple-bar-chart">
      {(title || subtitle) && (
        <div className="simple-bar-chart__header">
          {title && <h3 className="simple-bar-chart__title">{title}</h3>}
          {subtitle && <p className="simple-bar-chart__subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="simple-bar-chart__rows">
        {data.length === 0 ? (
          <div className="simple-bar-chart__empty">No data available</div>
        ) : (
          data.map((d) => {
            const pct = total > 0 ? Math.round(((d.value || 0) / total) * 100) : 0;
            const barWidth = Math.max(Math.round(((d.value || 0) / max) * 100), d.value > 0 ? 3 : 0);
            return (
              <div key={d.label} className="simple-bar-chart__row" title={`${d.label}: ${d.value} (${pct}%)`}>
                <span className="simple-bar-chart__label">{d.label}</span>
                <div className="simple-bar-chart__track">
                  <div
                    className="simple-bar-chart__fill"
                    style={{
                      width: `${barWidth}%`,
                      background: d.color || 'var(--color-accent)',
                    }}
                  />
                </div>
                <div className="simple-bar-chart__value-wrap">
                  <span className="simple-bar-chart__value tabular-nums">{valueFormatter(d.value)}</span>
                  {showPercentage && <span className="simple-bar-chart__pct tabular-nums">{pct}%</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
