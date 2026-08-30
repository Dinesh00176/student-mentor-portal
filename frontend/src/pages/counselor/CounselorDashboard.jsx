import { useEffect, useState } from 'react';
import { getCounselorDashboard } from '../../services/dashboard.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';

export default function CounselorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCounselorDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton rows={5} height={40} />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1>Counseling Cases</h1>
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', margin: 'var(--space-5) 0' }}>
        <StatCard label="Total Cases" value={data.totalCases} />
        <StatCard label="Active Cases" value={data.activeCases} tone="attention" />
        <StatCard label="Scheduled Sessions" value={data.scheduledSessions} />
        <StatCard label="Completed Sessions" value={data.completedSessions} tone="stable" />
        <StatCard label="Pending Appointments" value={data.pendingAppointments} tone={data.pendingAppointments > 0 ? 'attention' : 'stable'} />
      </div>

      <h2>Recent Sessions</h2>
      {data.recentSessions.length === 0 ? <EmptyState title="No counseling sessions yet." /> : (
        <div className="record-list">
          {data.recentSessions.map((s) => (
            <div key={s._id} className="record-card">
              <div className="record-card__title-row">
                <strong>{s.student?.studentCode}</strong>
                <Badge status={s.status} />
              </div>
              <div className="record-card__body">{s.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
