import './Badge.css';

const STATUS_ICON = {
  Stable: '●',
  'Needs Attention': '▲',
  'High Priority': '■',
  Healthy: '●',
  'Attention Required': '▲',
  Critical: '■',
  Open: '○',
  'In Progress': '◐',
  'Follow-up': '◑',
  Resolved: '●',
  Closed: '●',
  Scheduled: '○',
  Completed: '●',
  'Follow-up Required': '◑',
  Pending: '○',
  Overdue: '■',
};

const STATUS_TONE = {
  Stable: 'stable', Healthy: 'stable', Resolved: 'stable', Closed: 'neutral', Completed: 'stable',
  'Needs Attention': 'attention', 'Attention Required': 'attention', 'Follow-up': 'attention',
  'Follow-up Required': 'attention', Pending: 'neutral', Scheduled: 'neutral', 'In Progress': 'attention',
  'High Priority': 'critical', Critical: 'critical', Overdue: 'critical', Open: 'neutral',
};

export default function Badge({ status, children }) {
  const label = children || status;
  const tone = STATUS_TONE[status] || 'neutral';
  const icon = STATUS_ICON[status] || '●';
  return (
    <span className={`badge badge--${tone}`}>
      <span aria-hidden="true" className="badge__icon">{icon}</span>
      {label}
    </span>
  );
}
