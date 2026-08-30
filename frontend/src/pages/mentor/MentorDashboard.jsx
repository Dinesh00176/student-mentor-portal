import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMentorDashboard } from '../../services/dashboard.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMentorDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton rows={6} height={50} />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1>Who needs my attention today?</h1>

      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', margin: 'var(--space-5) 0' }}>
        <StatCard label="Assigned Students" value={data.totalAssignedStudents} />
        <StatCard label="Stable" value={data.statusBreakdown.Stable || 0} tone="stable" />
        <StatCard label="Needs Attention" value={data.statusBreakdown['Needs Attention'] || 0} tone="attention" />
        <StatCard label="High Priority" value={data.statusBreakdown['High Priority'] || 0} tone="critical" />
        <StatCard label="Pending Follow-ups" value={data.pendingFollowUps.length} />
        <StatCard label="Overdue Follow-ups" value={data.overdueFollowUps.length} tone={data.overdueFollowUps.length > 0 ? 'critical' : 'stable'} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 320 }}>
          <h2>Priority Students</h2>
          {data.priorityStudents.length === 0 ? (
            <EmptyState title="No students currently need attention." />
          ) : (
            <div className="record-list">
              {data.priorityStudents.map((p) => (
                <div
                  key={p.studentId}
                  className="record-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/mentor/students/${p.studentId}`)}
                >
                  <div className="record-card__title-row">
                    <strong>{p.student?.studentCode}</strong>
                    <Badge status={p.status} />
                  </div>
                  <ul className="reason-list">
                    {p.reasons.slice(0, 2).map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <h2>Upcoming Counseling</h2>
          {data.upcomingCounseling.length === 0 ? (
            <EmptyState title="No upcoming sessions." />
          ) : (
            <ul className="reason-list">
              {data.upcomingCounseling.map((c) => (
                <li key={c._id}>{c.student?.studentCode} — {new Date(c.date).toDateString()}</li>
              ))}
            </ul>
          )}

          <h2 style={{ marginTop: 'var(--space-5)' }}>Pending Follow-ups</h2>
          {data.pendingFollowUps.length === 0 ? (
            <EmptyState title="No pending follow-ups." />
          ) : (
            <ul className="reason-list">
              {data.pendingFollowUps.map((f) => (
                <li key={f._id}>{f.student?.studentCode} — due {new Date(f.dueDate).toDateString()} <Badge status={f.status} /></li>
              ))}
            </ul>
          )}

          <h2 style={{ marginTop: 'var(--space-5)' }}>Overdue Follow-ups</h2>
          {data.overdueFollowUps.length === 0 ? (
            <EmptyState title="No overdue follow-ups." />
          ) : (
            <ul className="reason-list">
              {data.overdueFollowUps.map((f) => (
                <li key={f._id}>{f.student?.studentCode} — was due {new Date(f.dueDate).toDateString()} <Badge status={f.status} /></li>
              ))}
            </ul>
          )}

          <h2 style={{ marginTop: 'var(--space-5)' }}>Active Interventions</h2>
          {data.activeInterventions.length === 0 ? (
            <EmptyState title="No active interventions." />
          ) : (
            <ul className="reason-list">
              {data.activeInterventions.map((i) => (
                <li key={i._id}>{i.student?.studentCode} — <Badge status={i.status} /></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
