import { useEffect, useState } from 'react';
import { getStudentDashboard } from '../../services/dashboard.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getStudentDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton rows={5} height={50} />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1>Welcome, {data.student.user?.name?.split(' ')[0]}</h1>

      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', margin: 'var(--space-5) 0' }}>
        <StatCard label="Semester GPA" value={data.academicSummary.gpa ?? '—'} />
        <StatCard label="Arrears" value={data.academicSummary.arrearCount} />
        <StatCard label="Attendance" value={`${data.attendanceSummary.percentage}%`} />
      </div>

      <div className="profile-rail">
        <div className="profile-rail__main">
          <h2>Attendance Status</h2>
          <Badge status={data.attendanceSummary.status} />
        </div>
        <div className="profile-rail__side">
          <h2>Your Mentor</h2>
          <p>
            <strong>{data.student.assignedMentor?.name || 'Not yet assigned'}</strong><br />
            {data.student.assignedMentor?.email}
          </p>
          <h2>Next Follow-up</h2>
          {data.nextFollowUp ? (
            <p>{new Date(data.nextFollowUp.dueDate).toDateString()}</p>
          ) : (
            <EmptyState title="No upcoming follow-up." />
          )}
        </div>
      </div>
    </div>
  );
}
