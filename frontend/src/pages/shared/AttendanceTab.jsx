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

  useEffect(() => {
    setLoading(true);
    getStudentAttendance(studentId)
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <Skeleton rows={4} height={36} />;
  if (error) return <ErrorState message={error} />;
  if (!data || data.records.length === 0) return <EmptyState title="No attendance records yet" />;

  return (
    <div>
      <div className="profile-summary" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="profile-summary__item">
          <div className="profile-summary__label">Overall Attendance</div>
          <strong>{data.summary.percentage}%</strong>
        </div>
        <div className="profile-summary__item">
          <div className="profile-summary__label">Status</div>
          <Badge status={data.summary.status} />
        </div>
        <div className="profile-summary__item">
          <div className="profile-summary__label">Classes Attended</div>
          <strong>{data.summary.attendedClasses} / {data.summary.totalClasses}</strong>
        </div>
      </div>

      <h3>By Subject</h3>
      <DataTable
        columns={[
          { key: 'subject', header: 'Subject' },
          { key: 'totalClasses', header: 'Total' },
          { key: 'attendedClasses', header: 'Attended' },
          { key: 'percentage', header: '%', render: (r) => `${r.percentage}%` },
          { key: 'status', header: 'Status', render: (r) => {
            const pct = r.percentage;
            const status = pct >= 85 ? 'Healthy' : pct >= 75 ? 'Attention Required' : 'Critical';
            return <Badge status={status} />;
          } },
        ]}
        rows={data.records}
      />
    </div>
  );
}
