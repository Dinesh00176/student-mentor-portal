import { useEffect, useState } from 'react';
import { getStudentDashboard } from '../../services/dashboard.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import Tabs from '../../components/Tabs';
import AcademicTab from '../shared/AcademicTab';
import AttendanceTab from '../shared/AttendanceTab';
import ActivityTab from '../shared/ActivityTab';
import '../shared/StudentProfile.css';

// Students see their own profile with a permission-limited tab set:
// no mentor remarks, no raw attention/risk reasoning (that's for mentor/admin).
export default function StudentProfileSelf() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getStudentDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton rows={5} height={40} />;
  if (error) return <ErrorState message={error} />;

  const studentId = data.student._id;
  const tabs = [
    { id: 'academic', label: 'Academic', content: <AcademicTab studentId={studentId} /> },
    { id: 'attendance', label: 'Attendance', content: <AttendanceTab studentId={studentId} /> },
    { id: 'activity', label: 'Activity', content: <ActivityTab studentId={studentId} /> },
  ];

  return (
    <div>
      <div className="profile-header">
        <div>
          <div className="profile-header__id">{data.student.studentCode}</div>
          <h1>{data.student.user?.name}</h1>
          <div className="profile-header__meta">{data.student.department?.name} · Year {data.student.year}, Semester {data.student.semester}</div>
        </div>
      </div>
      <Tabs tabs={tabs} />
    </div>
  );
}
