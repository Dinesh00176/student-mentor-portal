import './Timeline.css';

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const TYPE_ICONS = {
  remark: '💬',
  intervention: '⚡',
  counseling: '🛡️',
  'follow-up': '📅',
  appointment: '🕒',
  academic: '📊',
};

export default function Timeline({ events = [] }) {
  if (!events || events.length === 0) {
    return <p className="timeline-empty">No activity recorded yet.</p>;
  }

  return (
    <ol className="timeline">
      {events.map((e, i) => {
        const typeKey = (e.type || '').toLowerCase();
        const icon = TYPE_ICONS[typeKey] || '•';
        return (
          <li key={i} className={`timeline__item timeline__item--${typeKey}`}>
            <div className="timeline__marker" aria-hidden="true">
              <span className="timeline__icon">{icon}</span>
            </div>
            <div className="timeline__content">
              <div className="timeline__header">
                <span className="timeline__title">{e.title}</span>
                <span className="timeline__date tabular-nums">{formatDate(e.date)}</span>
              </div>
              {e.detail && <div className="timeline__detail">{e.detail}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
