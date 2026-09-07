import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudent, getStudentAttention, deactivateStudent } from '../../services/student.service';
import { generateProgressSummary } from '../../services/ai.service';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Tabs from '../../components/Tabs';
import OverviewTab from './OverviewTab';
import AcademicTab from './AcademicTab';
import AttendanceTab from './AttendanceTab';
import CounselingTab from './CounselingTab';
import RemarksTab from './RemarksTab';
import InterventionsTab from './InterventionsTab';
import ActivityTab from './ActivityTab';
import AssignMentorModal from './AssignMentorModal';
import EditStudentModal from './EditStudentModal';
import './StudentProfile.css';

function getInitials(name) {
  if (!name) return 'S';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Used by both /admin/students/:id and /mentor/students/:id
export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();
  const [student, setStudent] = useState(null);
  const [attention, setAttention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const canEdit = user.role === 'mentor' || user.role === 'admin';
  const canSeeAttention = user.role === 'mentor' || user.role === 'admin';
  const isAdmin = user.role === 'admin';

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      getStudent(id),
      canSeeAttention ? getStudentAttention(id) : Promise.resolve({ data: { data: null } }),
    ])
      .then(([sRes, aRes]) => {
        setStudent(sRes.data.data);
        setAttention(aRes.data.data);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id, canSeeAttention]);

  const handleGenerateSummary = async () => {
    setAiLoading(true);
    try {
      const { data } = await generateProgressSummary(id);
      setAiSummary(data.data);
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateStudent(id);
      push('Student deactivated.');
      setShowDeactivateConfirm(false);
      navigate('/admin/students');
    } catch (err) {
      push(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <Skeleton rows={6} height={40} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!student) return null;

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: attention ? (
        <OverviewTab student={student} attention={attention} />
      ) : (
        <p>Overview is limited for this role.</p>
      ),
    },
    { id: 'academic', label: 'Academic', content: <AcademicTab studentId={id} /> },
    { id: 'attendance', label: 'Attendance', content: <AttendanceTab studentId={id} /> },
    { id: 'counseling', label: 'Counseling', content: <CounselingTab studentId={id} canCreate={canEdit} /> },
    { id: 'remarks', label: 'Remarks', content: <RemarksTab studentId={id} canCreate={user.role === 'mentor'} /> },
    { id: 'interventions', label: 'Interventions', content: <InterventionsTab studentId={id} canManage={canEdit} /> },
    { id: 'activity', label: 'Activity', content: <ActivityTab studentId={id} /> },
  ];

  return (
    <div>
      <div className="profile-header">
        <div className="profile-header__identity">
          <div className="profile-header__avatar" aria-hidden="true">
            {getInitials(student.user?.name)}
          </div>
          <div className="profile-header__info">
            <div className="profile-header__code-row">
              <span className="profile-header__id">{student.studentCode}</span>
              {attention && <Badge status={attention.status} size="sm" />}
            </div>
            <h1 className="profile-header__name">{student.user?.name}</h1>
            <div className="profile-header__meta">
              <span>{student.department?.name}</span>
              <span>·</span>
              <span>Year {student.year}, Semester {student.semester} (Sec {student.section || 'A'})</span>
              <span>·</span>
              <Badge status={student.enrollmentStatus === 'active' ? 'Stable' : student.enrollmentStatus} size="sm">
                {student.enrollmentStatus}
              </Badge>
            </div>
          </div>
        </div>

        <div className="profile-header__actions">
          {(user.role === 'mentor' || isAdmin) && (
            <Button
              size="sm"
              variant="secondary"
              loading={aiLoading}
              onClick={handleGenerateSummary}
            >
              ✨ Generate AI Summary
            </Button>
          )}
          {isAdmin && (
            <>
              <Button size="sm" variant="secondary" onClick={() => setShowEditModal(true)}>
                Edit Details
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowAssignModal(true)}>
                {student.assignedMentor ? 'Reassign Mentor' : 'Assign Mentor'}
              </Button>
              {student.enrollmentStatus === 'active' && (
                <Button size="sm" variant="danger" onClick={() => setShowDeactivateConfirm(true)}>
                  Deactivate
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {aiSummary && (
        <div
          className="record-card"
          style={{
            marginBottom: 'var(--space-5)',
            borderLeft: '4px solid var(--color-accent)',
            background: 'linear-gradient(180deg, var(--color-accent-tint) 0%, var(--color-surface) 100%)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="record-card__title-row" style={{ paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <strong style={{ color: 'var(--color-accent-strong)', fontSize: '1rem' }}>✨ AI Academic &amp; Behavioral Synthesis</strong>
              <span style={{ fontSize: '0.75rem', background: 'var(--color-surface)', border: '1px solid var(--color-accent-border)', padding: '2px 8px', borderRadius: 'var(--radius-full)', color: 'var(--color-accent-strong)', fontWeight: 600 }}>
                {aiSummary.provider || 'Academic Intelligence'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(aiSummary.summary || '');
                  push('AI Summary copied to clipboard.');
                }}
              >
                📋 Copy Summary
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAiSummary(null)}
              >
                ✕ Dismiss
              </Button>
            </div>
          </div>

          <div className="record-card__body" style={{ marginTop: 'var(--space-3)', lineHeight: 1.6 }}>
            {aiSummary.executiveSummary && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Executive Overview</h4>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-ink)' }}>{aiSummary.executiveSummary}</p>
              </div>
            )}

            {aiSummary.riskDrivers && aiSummary.riskDrivers.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', color: 'var(--color-critical)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>⚠️ Key Risk Factors &amp; Triggers</h4>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--color-ink)' }}>
                  {aiSummary.riskDrivers.map((rd, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{rd}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiSummary.actionItems && aiSummary.actionItems.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', color: 'var(--color-accent-strong)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>💡 Recommended Faculty Action Plan</h4>
                <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--color-ink)' }}>
                  {aiSummary.actionItems.map((ai, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{ai}</li>
                  ))}
                </ol>
              </div>
            )}

            {aiSummary.talkingPoints && aiSummary.talkingPoints.length > 0 && (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', color: 'var(--color-info-strong)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>💬 Suggested Mentoring Conversation Starters</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {aiSummary.talkingPoints.map((tp, idx) => (
                    <div key={idx} style={{ background: 'var(--color-surface)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-info)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                      {tp}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!aiSummary.executiveSummary && (
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--color-ink)' }}>
                {aiSummary.summary}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-3)', paddingTop: 'var(--space-2)', borderTop: '1px dashed var(--color-border)', fontSize: '0.78rem', color: 'var(--color-ink-faint)' }}>
              <span>{aiSummary.label || 'AI-generated — review before institutional use.'}</span>
              {aiSummary.followUpInterval && <span><strong>Suggested Follow-up Window:</strong> {aiSummary.followUpInterval}</span>}
            </div>
          </div>
        </div>
      )}

      <Tabs tabs={tabs} />

      {showAssignModal && (
        <AssignMentorModal
          studentId={id}
          currentMentorId={student.assignedMentor?._id}
          onClose={() => setShowAssignModal(false)}
          onAssigned={load}
        />
      )}

      {showEditModal && (
        <EditStudentModal student={student} onClose={() => setShowEditModal(false)} onSaved={load} />
      )}

      {showDeactivateConfirm && (
        <ConfirmDialog
          title="Deactivate student?"
          message={`${student.user?.name}'s account will be deactivated and login disabled. All academic, attendance, counseling, and intervention history is preserved and can be viewed later.`}
          confirmLabel="Deactivate Student"
          onCancel={() => setShowDeactivateConfirm(false)}
          onConfirm={handleDeactivate}
        />
      )}
    </div>
  );
}
