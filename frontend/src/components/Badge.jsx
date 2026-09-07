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
  active: '●',
  inactive: '○',
  suspended: '■',
  Approved: '●',
  Rejected: '✕',
  Cancelled: '✕',
};

const STATUS_TONE = {
  Stable: 'stable',
  Healthy: 'stable',
  Resolved: 'stable',
  Completed: 'stable',
  active: 'stable',
  Approved: 'stable',
  'Needs Attention': 'attention',
  'Attention Required': 'attention',
  'Follow-up': 'attention',
  'Follow-up Required': 'attention',
  'In Progress': 'attention',
  Pending: 'attention',
  'High Priority': 'critical',
  Critical: 'critical',
  Overdue: 'critical',
  suspended: 'critical',
  Rejected: 'critical',
  Closed: 'neutral',
  Scheduled: 'info',
  Open: 'info',
  inactive: 'neutral',
  Cancelled: 'neutral',
};

export default function Badge({ status, children, size = 'md' }) {
  const label = children || status;
  const tone = STATUS_TONE[status] || 'neutral';
  const icon = STATUS_ICON[status] || '●';
  return (
    <span className={`badge badge--${tone} badge--${size}`}>
      <span aria-hidden="true" className="badge__dot">{icon}</span>
      <span className="badge__label">{label}</span>
    </span>
  );
}
