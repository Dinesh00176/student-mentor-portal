import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudentDashboard } from '../../services/dashboard.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getStudentDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <Skeleton rows={5} height={50} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const firstName = data.student.user?.name?.split(' ')[0] || 'Student';
  const attendancePct = data.attendanceSummary.percentage ?? 0;
  const attendanceTone = attendancePct >= 80 ? 'stable' : attendancePct >= 75 ? 'attention' : 'critical';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {firstName} 👋</h1>
          <p className="page-header__subtitle">
            {data.student.department?.name} · Year {data.student.year}, Semester {data.student.semester} ({data.student.studentCode})
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button as={Link} to="/student/appointments" variant="primary" size="sm">
            Request Meeting
          </Button>
          <Button as={Link} to="/student/profile" variant="secondary" size="sm">
            View My Profile
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid-cards" style={{ marginBottom: 'var(--space-5)' }}>
        <StatCard
          label="Semester GPA"
          value={data.academicSummary.gpa ?? '—'}
          tone="accent"
          trend="SGPA"
        />
        <StatCard
          label="Active Arrears"
          value={data.academicSummary.arrearCount ?? 0}
          tone={data.academicSummary.arrearCount > 0 ? 'critical' : 'stable'}
        />
        <StatCard
          label="Overall Attendance"
          value={`${attendancePct}%`}
          tone={attendanceTone}
          trend={data.attendanceSummary.status}
        />
      </div>

      <div className="profile-rail">
        <div className="profile-rail__main">
          <div className="record-card" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="record-card__title-row">
              <h3 style={{ margin: 0 }}>Attendance Health</h3>
              <Badge status={data.attendanceSummary.status} />
            </div>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.85rem', margin: 'var(--space-2) 0 var(--space-3)' }}>
              Institutional requirement is at least 75% aggregate attendance across all registered courses.
            </p>
            <div style={{ background: 'var(--color-surface-sunken)', height: 8, borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(attendancePct, 100)}%`,
                  background: attendancePct >= 80 ? 'var(--color-stable)' : attendancePct >= 75 ? 'var(--color-attention)' : 'var(--color-critical)',
                  height: '100%',
                  borderRadius: 'var(--radius-full)',
                }}
              />
            </div>
          </div>

          <div className="record-card">
            <div className="record-card__title-row">
              <h3 style={{ margin: 0 }}>Next Scheduled Follow-up</h3>
            </div>
            {data.nextFollowUp ? (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-ink)' }}>
                  📅 Due Date: <strong>{new Date(data.nextFollowUp.dueDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </p>
                {data.nextFollowUp.notes && (
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-ink-muted)', marginTop: 4 }}>
                    {data.nextFollowUp.notes}
                  </p>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <p style={{ color: 'var(--color-ink-faint)', fontSize: '0.85rem', margin: 0 }}>No upcoming follow-ups scheduled at this time.</p>
              </div>
            )}
          </div>
        </div>

        <div className="profile-rail__side">
          <div className="record-card">
            <h3 style={{ margin: '0 0 var(--space-3)' }}>Assigned Faculty Mentor</h3>
            {data.student.assignedMentor ? (
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                  {data.student.assignedMentor.name}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--color-ink-muted)', marginTop: 2 }}>
                  {data.student.assignedMentor.email}
                </div>
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <Button as={Link} to="/student/appointments" fullWidth size="sm">
                    Book Mentoring Slot
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState title="No mentor assigned yet" description="Your department head will assign a faculty mentor shortly." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
