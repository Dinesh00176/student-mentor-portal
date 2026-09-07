import { useEffect, useState } from 'react';
import { getStudentDashboard } from '../../services/dashboard.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import Tabs from '../../components/Tabs';
import Badge from '../../components/Badge';
import AcademicTab from '../shared/AcademicTab';
import AttendanceTab from '../shared/AttendanceTab';
import ActivityTab from '../shared/ActivityTab';
import '../shared/StudentProfile.css';

function getInitials(name) {
  if (!name) return 'S';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Students see their own profile with a permission-limited tab set:
// no mentor remarks, no raw attention/risk reasoning (that's for mentor/admin).
export default function StudentProfileSelf() {
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

  if (loading) return <Skeleton rows={5} height={40} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const student = data.student;
  const studentId = student._id;
  const tabs = [
    { id: 'academic', label: 'Academic Progression', content: <AcademicTab studentId={studentId} /> },
    { id: 'attendance', label: 'Attendance Record', content: <AttendanceTab studentId={studentId} /> },
    { id: 'activity', label: 'Activity Timeline', content: <ActivityTab studentId={studentId} /> },
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
              <Badge status={student.enrollmentStatus === 'active' ? 'Stable' : student.enrollmentStatus} size="sm">
                {student.enrollmentStatus}
              </Badge>
            </div>
            <h1 className="profile-header__name">{student.user?.name}</h1>
            <div className="profile-header__meta">
              <span>{student.department?.name}</span>
              <span>·</span>
              <span>Year {student.year}, Semester {student.semester} (Sec {student.section || 'A'})</span>
            </div>
          </div>
        </div>
      </div>
      <Tabs tabs={tabs} />
    </div>
  );
}
