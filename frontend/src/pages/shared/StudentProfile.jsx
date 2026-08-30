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
  if (error) return <ErrorState message={error} />;
  if (!student) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', content: attention ? <OverviewTab student={student} attention={attention} /> : <p>Overview is limited for this role.</p> },
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
        <div>
          <div className="profile-header__id">{student.studentCode}</div>
          <h1>{student.user?.name}</h1>
          <div className="profile-header__meta">{student.department?.name} · Year {student.year}, Semester {student.semester}</div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          {attention && <Badge status={attention.status} />}
          {user.role === 'mentor' && (
            <Button size="sm" variant="secondary" onClick={handleGenerateSummary} disabled={aiLoading}>
              {aiLoading ? 'Generating…' : 'Generate Progress Summary'}
            </Button>
          )}
          {isAdmin && (
            <>
              <Button size="sm" variant="secondary" onClick={() => setShowEditModal(true)}>Edit Details</Button>
              <Button size="sm" variant="secondary" onClick={() => setShowAssignModal(true)}>
                {student.assignedMentor ? 'Reassign Mentor' : 'Assign Mentor'}
              </Button>
              {student.enrollmentStatus === 'active' && (
                <Button size="sm" variant="danger" onClick={() => setShowDeactivateConfirm(true)}>Deactivate</Button>
              )}
            </>
          )}
        </div>
      </div>

      {aiSummary && (
        <div className="record-card" style={{ marginBottom: 'var(--space-5)', borderLeft: '3px solid var(--color-accent)' }}>
          <div className="record-card__title-row">
            <strong>AI-generated — review before use.</strong>
          </div>
          <div className="record-card__body" style={{ whiteSpace: 'pre-wrap' }}>{aiSummary.summary}</div>
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
          message={`${student.user?.name}'s account will be deactivated and login disabled. All academic, attendance, counseling, and intervention history is preserved and can be viewed later. This can be reversed by editing enrollment status back to active.`}
          confirmLabel="Deactivate"
          onCancel={() => setShowDeactivateConfirm(false)}
          onConfirm={handleDeactivate}
        />
      )}
    </div>
  );
}
