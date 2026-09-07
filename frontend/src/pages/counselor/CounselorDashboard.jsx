import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCounselorDashboard } from '../../services/dashboard.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

export default function CounselorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getCounselorDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <Skeleton rows={5} height={40} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Counseling &amp; Wellness Services</h1>
          <p className="page-header__subtitle">
            Manage counseling case intake, 1-on-1 wellness sessions, and student appointment requests.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button as={Link} to="/counselor/cases" variant="primary" size="sm">
            View Active Cases
          </Button>
          <Button as={Link} to="/counselor/appointments" variant="secondary" size="sm">
            Meeting Requests
          </Button>
        </div>
      </div>

      <div className="confidentiality-notice">
        <span className="confidentiality-notice__icon" aria-hidden="true">🔒</span>
        <span>
          <strong>Counselor Case Vault:</strong> Student wellness discussions and case notes are private, protected, and accessible only to counseling personnel.
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid-cards" style={{ marginBottom: 'var(--space-5)' }}>
        <StatCard
          label="Total Student Cases"
          value={data.totalCases}
          tone="accent"
          trend="Cumulative"
        />
        <StatCard
          label="Active Caseload"
          value={data.activeCases}
          tone="attention"
          trend="In Progress"
        />
        <StatCard
          label="Scheduled Sessions"
          value={data.scheduledSessions}
          tone="info"
          trend="Upcoming"
        />
        <StatCard
          label="Completed Sessions"
          value={data.completedSessions}
          tone="stable"
          trend="Resolved"
        />
        <StatCard
          label="Pending Meeting Requests"
          value={data.pendingAppointments}
          tone={data.pendingAppointments > 0 ? 'attention' : 'stable'}
          trend="Inbox"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Recent Guidance &amp; Counseling Sessions</h2>
      </div>

      {data.recentSessions.length === 0 ? (
        <EmptyState
          title="No recent counseling sessions logged"
          description="Schedule or log counseling interactions from the student profile or appointments tab."
        />
      ) : (
        <div className="record-list">
          {data.recentSessions.map((s) => (
            <div key={s._id} className="record-card" style={{ borderLeft: '3px solid var(--color-info)' }}>
              <div className="record-card__title-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: '0.95rem' }}>{s.student?.user?.name || s.student?.studentCode}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>
                    ({s.student?.studentCode})
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', background: 'var(--color-info-tint)', color: 'var(--color-info-strong)', padding: '2px 8px', borderRadius: 'var(--radius-xs)' }}>
                    {s.sessionType}
                  </span>
                  <Badge status={s.status} size="sm" />
                </div>
                <div className="record-card__meta tabular-nums">
                  {new Date(s.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div className="record-card__body" style={{ marginTop: 'var(--space-2)' }}>
                <strong>Session Reason / Notes:</strong> {s.reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
