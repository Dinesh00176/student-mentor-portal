import './Timeline.css';

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Timeline({ events }) {
  if (!events || events.length === 0) {
    return <p className="timeline-empty">No activity recorded yet.</p>;
  }
  return (
    <ol className="timeline">
      {events.map((e, i) => (
        <li key={i} className={`timeline__item timeline__item--${e.type.toLowerCase()}`}>
          <div className="timeline__marker" aria-hidden="true" />
          <div className="timeline__content">
            <div className="timeline__date">{formatDate(e.date)}</div>
            <div className="timeline__title">{e.title}</div>
            {e.detail && <div className="timeline__detail">{e.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
