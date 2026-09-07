import { useEffect, useState } from 'react';
import { getStudentAttendance } from '../../services/attendance.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';

export default function AttendanceTab({ studentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getStudentAttendance(studentId)
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [studentId]);

  if (loading) return <Skeleton rows={4} height={36} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data || data.records.length === 0) return <EmptyState title="No attendance records yet" />;

  const pct = data.summary.percentage || 0;
  const pctColor = pct >= 80 ? 'var(--color-stable)' : pct >= 75 ? 'var(--color-attention)' : 'var(--color-critical)';

  return (
    <div>
      <div className="profile-summary">
        <div className="profile-summary__item">
          <div className="profile-summary__label">Overall Attendance</div>
          <div className="profile-summary__value tabular-nums" style={{ color: pctColor }}>
            {pct}%
          </div>
        </div>
        <div className="profile-summary__item">
          <div className="profile-summary__label">Institutional Status</div>
          <div style={{ marginTop: 4 }}>
            <Badge status={data.summary.status} />
          </div>
        </div>
        <div className="profile-summary__item">
          <div className="profile-summary__label">Classes Attended</div>
          <div className="profile-summary__value tabular-nums">
            {data.summary.attendedClasses} <span style={{ fontSize: '0.9rem', color: 'var(--color-ink-faint)', fontWeight: 500 }}>/ {data.summary.totalClasses}</span>
          </div>
        </div>
      </div>

      {/* Visual Attendance Safety Meter */}
      <div className="record-card" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Attendance Safety Threshold</span>
          <span className="tabular-nums" style={{ fontSize: '0.84rem', fontWeight: 700, color: pctColor }}>{pct}% (Min 75% required)</span>
        </div>
        <div style={{ background: 'var(--color-surface-sunken)', height: 10, borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: pctColor,
              height: '100%',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.4s var(--ease-spring)',
            }}
          />
        </div>
      </div>

      <h3 style={{ marginBottom: 'var(--space-3)' }}>Subject-wise Attendance Breakdown</h3>
      <DataTable
        columns={[
          { key: 'subject', header: 'Subject' },
          { key: 'totalClasses', header: 'Total Sessions', render: (r) => <span className="tabular-nums">{r.totalClasses}</span> },
          { key: 'attendedClasses', header: 'Attended', render: (r) => <span className="tabular-nums">{r.attendedClasses}</span> },
          {
            key: 'percentage',
            header: 'Attendance %',
            render: (r) => <strong className="tabular-nums">{r.percentage}%</strong>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (r) => {
              const status = r.percentage >= 85 ? 'Healthy' : r.percentage >= 75 ? 'Attention Required' : 'Critical';
              return <Badge status={status} />;
            },
          },
        ]}
        rows={data.records}
      />
    </div>
  );
}
