import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMentorDashboard } from '../../services/dashboard.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getMentorDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <Skeleton rows={6} height={50} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Faculty Mentoring Overview</h1>
          <p className="page-header__subtitle">
            Attention cockpit: monitor high-priority students, follow-ups, and intervention status.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button as={Link} to="/mentor/students" variant="primary" size="sm">
            View All Students
          </Button>
          <Button as={Link} to="/mentor/appointments" variant="secondary" size="sm">
            Meeting Requests
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-cards" style={{ marginBottom: 'var(--space-5)' }}>
        <StatCard
          label="Assigned Cohort"
          value={data.totalAssignedStudents}
          tone="accent"
          trend="Enrolled"
        />
        <StatCard
          label="Stable Students"
          value={data.statusBreakdown.Stable || 0}
          tone="stable"
          trend="Good progress"
        />
        <StatCard
          label="Needs Attention"
          value={data.statusBreakdown['Needs Attention'] || 0}
          tone="attention"
          trend="Monitoring"
        />
        <StatCard
          label="High Priority / At Risk"
          value={data.statusBreakdown['High Priority'] || 0}
          tone="critical"
          trend="Requires action"
        />
        <StatCard
          label="Pending Follow-ups"
          value={data.pendingFollowUps.length}
          tone={data.pendingFollowUps.length > 0 ? 'attention' : 'stable'}
        />
        <StatCard
          label="Overdue Follow-ups"
          value={data.overdueFollowUps.length}
          tone={data.overdueFollowUps.length > 0 ? 'critical' : 'stable'}
        />
      </div>

      <div className="profile-rail">
        <div className="profile-rail__main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>🚨 Priority Attention Queue</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-faint)' }}>Sorted by academic and attendance risk signals</span>
          </div>

          {data.priorityStudents.length === 0 ? (
            <EmptyState
              title="All assigned students are currently in good standing"
              description="No urgent academic or attendance risk triggers flagged for your cohort."
            />
          ) : (
            <div className="record-list">
              {data.priorityStudents.map((p) => (
                <div
                  key={p.studentId}
                  className="record-card record-card--interactive"
                  onClick={() => navigate(`/mentor/students/${p.studentId}`)}
                  style={{
                    borderLeft: p.status === 'High Priority' ? '4px solid var(--color-critical)' : '4px solid var(--color-attention)',
                  }}
                >
                  <div className="record-card__title-row">
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{p.student?.user?.name || p.student?.studentCode}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-faint)', marginLeft: 6, fontFamily: 'var(--font-mono)' }}>
                        ({p.student?.studentCode})
                      </span>
                    </div>
                    <Badge status={p.status} size="sm" />
                  </div>
                  <ul className="reason-list" style={{ marginTop: 6 }}>
                    {p.reasons.slice(0, 2).map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  <div style={{ marginTop: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-accent-strong)', fontWeight: 600 }}>
                      Open Student Profile →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-rail__side">
          <div className="record-card" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="record-card__title-row">
              <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Overdue Action Items</h3>
              {data.overdueFollowUps.length > 0 && <Badge status="Critical" size="sm">{data.overdueFollowUps.length}</Badge>}
            </div>
            {data.overdueFollowUps.length === 0 ? (
              <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-faint)', margin: 'var(--space-2) 0 0' }}>No overdue follow-ups.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'var(--space-2)' }}>
                {data.overdueFollowUps.map((f) => (
                  <div
                    key={f._id}
                    style={{ fontSize: '0.84rem', padding: '6px 8px', background: 'var(--color-critical-tint)', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}
                    onClick={() => navigate(`/mentor/students/${f.student?._id}`)}
                  >
                    <strong>{f.student?.studentCode}</strong> — Due {new Date(f.dueDate).toLocaleDateString()}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="record-card" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ margin: '0 0 var(--space-2)', fontSize: '0.95rem' }}>Upcoming Counseling</h3>
            {data.upcomingCounseling.length === 0 ? (
              <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-faint)', margin: 0 }}>No sessions scheduled this week.</p>
            ) : (
              <ul className="reason-list" style={{ margin: 0 }}>
                {data.upcomingCounseling.map((c) => (
                  <li key={c._id}>
                    <strong>{c.student?.studentCode}</strong> — {new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="record-card">
            <h3 style={{ margin: '0 0 var(--space-2)', fontSize: '0.95rem' }}>Pending Follow-ups</h3>
            {data.pendingFollowUps.length === 0 ? (
              <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-faint)', margin: 0 }}>No pending follow-ups.</p>
            ) : (
              <ul className="reason-list" style={{ margin: 0 }}>
                {data.pendingFollowUps.slice(0, 5).map((f) => (
                  <li key={f._id}>
                    <strong>{f.student?.studentCode}</strong> — Due {new Date(f.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
