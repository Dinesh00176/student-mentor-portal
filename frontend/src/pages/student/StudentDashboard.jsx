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
      .then(({ data: res }) => {
        setData(res.data || null);
        setError('');
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <Skeleton rows={6} height={50} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data || !data.student) {
    return (
      <EmptyState
        title="Student record unavailable"
        description="Your student profile could not be loaded. Please contact your administrator."
        action={<Button onClick={load} size="sm">Retry</Button>}
      />
    );
  }

  const student = data.student;
  const firstName = student.user?.name?.split(' ')[0] || student.studentCode || 'Student';

  // Defensive metrics resolution (supports both dedicated summary objects and attention signals fallback)
  const attendancePct = data.attendanceSummary?.percentage ?? data.attention?.signals?.attendancePercentage ?? 0;
  const attendanceStatus = data.attendanceSummary?.status ?? data.attention?.signals?.attendanceStatus ?? (attendancePct >= 85 ? 'Healthy' : attendancePct >= 75 ? 'Attention Required' : 'Critical');
  const attendanceTone = attendancePct >= 85 ? 'stable' : attendancePct >= 75 ? 'attention' : 'critical';

  const gpa = data.academicSummary?.gpa ?? data.attention?.signals?.gpa ?? null;
  const gpaDisplay = gpa !== null && gpa !== undefined ? Number(gpa).toFixed(2) : '—';
  const arrearCount = data.academicSummary?.arrearCount ?? data.attention?.signals?.arrearCount ?? 0;

  const mentor = student.assignedMentor;

  return (
    <div>
      {/* Student Welcome Header */}
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            Welcome back, {firstName} 👋
          </h1>
          <p className="page-header__subtitle">
            <strong>{student.studentCode}</strong> · {student.department?.name || 'Department'} · Year {student.year}, Semester {student.semester} {student.section ? `(Sec ${student.section})` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button as={Link} to="/student/appointments" variant="primary" size="sm" disabled={!mentor}>
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
          label="Semester SGPA"
          value={gpaDisplay}
          tone="accent"
          trend={gpa !== null && gpa >= 7.0 ? 'Strong Standing' : gpa !== null && gpa < 6.0 ? 'Academic Attention' : 'Active Semester'}
        />
        <StatCard
          label="Active Arrears"
          value={arrearCount}
          tone={arrearCount > 0 ? 'critical' : 'stable'}
          trend={arrearCount === 0 ? 'All Clear' : 'Reattempt Required'}
        />
        <StatCard
          label="Overall Attendance"
          value={`${attendancePct}%`}
          tone={attendanceTone}
          trend={attendanceStatus}
        />
      </div>

      {/* Main Content Rail */}
      <div className="profile-rail">
        <div className="profile-rail__main">
          {/* Attendance Health Gauge */}
          <div className="record-card" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="record-card__title-row">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Attendance Health &amp; Compliance</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>
                  Aggregate course engagement for Semester {student.semester}
                </span>
              </div>
              <Badge status={attendanceStatus} />
            </div>

            <div style={{ margin: 'var(--space-3) 0 var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: 6, fontWeight: 600 }}>
                <span>Current: {attendancePct}%</span>
                <span style={{ color: 'var(--color-ink-faint)' }}>Min Required: 75%</span>
              </div>
              <div style={{ background: 'var(--color-surface-sunken)', height: 10, borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(attendancePct, 100)}%`,
                    background: attendancePct >= 85 ? 'var(--color-stable)' : attendancePct >= 75 ? 'var(--color-attention)' : 'var(--color-critical)',
                    height: '100%',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            <p style={{ color: 'var(--color-ink-faint)', fontSize: '0.8rem', margin: 0 }}>
              Institutional policy requires at least 75% aggregate attendance across all registered courses for examination eligibility.
            </p>
          </div>

          {/* Next Scheduled Follow-up */}
          <div className="record-card" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="record-card__title-row">
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Next Scheduled Follow-up</h3>
              {data.nextFollowUp && <Badge status={data.nextFollowUp.status} size="sm" />}
            </div>
            {data.nextFollowUp ? (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-ink)' }}>
                  📅 Due Date: <strong>{new Date(data.nextFollowUp.dueDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </p>
                {data.nextFollowUp.notes && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginTop: 6, lineHeight: 1.5 }}>
                    {data.nextFollowUp.notes}
                  </p>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <p style={{ color: 'var(--color-ink-faint)', fontSize: '0.85rem', margin: 0 }}>
                  No pending follow-up milestones scheduled at this time.
                </p>
              </div>
            )}
          </div>

          {/* Active Support & Interventions Overview */}
          {data.activeInterventions && data.activeInterventions.length > 0 && (
            <div className="record-card">
              <div className="record-card__title-row">
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Active Support Initiatives</h3>
                <Badge status="Attention Required" size="sm">{data.activeInterventions.length} Active</Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                {data.activeInterventions.slice(0, 3).map((iv) => (
                  <div key={iv._id} style={{ padding: '8px 12px', background: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>{iv.interventionType}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-ink-faint)' }}>{iv.status}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>
                      {iv.problemIdentified}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Mentor & Actions */}
        <div className="profile-rail__side">
          {/* Assigned Mentor Card */}
          <div className="record-card" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ margin: '0 0 var(--space-3)', fontSize: '1.05rem' }}>Assigned Faculty Mentor</h3>
            {mentor ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-accent-tint)',
                      color: 'var(--color-accent-strong)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      border: '1px solid var(--color-accent-border)',
                    }}
                    aria-hidden="true"
                  >
                    {mentor.name?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                      {mentor.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                      Faculty Advisor
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.84rem', color: 'var(--color-ink-muted)', marginTop: 'var(--space-2)', wordBreak: 'break-all' }}>
                  ✉️ {mentor.email}
                </div>
                {mentor.phone && (
                  <div style={{ fontSize: '0.84rem', color: 'var(--color-ink-muted)', marginTop: 4 }}>
                    📞 {mentor.phone}
                  </div>
                )}

                <div style={{ marginTop: 'var(--space-4)' }}>
                  <Button as={Link} to="/student/appointments" fullWidth size="sm" variant="primary">
                    Book Mentoring Slot
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No mentor assigned yet"
                description="Your department administrator will assign an official faculty mentor shortly."
              />
            )}
          </div>

          {/* Quick Resources / Wellness */}
          <div className="record-card">
            <h3 style={{ margin: '0 0 var(--space-2)', fontSize: '0.95rem' }}>Campus Wellbeing &amp; Support</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', lineHeight: 1.5, margin: '0 0 var(--space-3)' }}>
              Confidential counseling and academic advising services are available for all registered students.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <Button as={Link} to="/student/counseling" variant="secondary" size="sm" fullWidth>
                View Counseling History
              </Button>
              <Button as={Link} to="/student/interventions" variant="ghost" size="sm" fullWidth>
                Support Initiatives
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
