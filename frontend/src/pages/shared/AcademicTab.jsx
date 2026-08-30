import { useEffect, useState } from 'react';
import { getStudentAcademics } from '../../services/academic.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';

export default function AcademicTab({ studentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getStudentAcademics(studentId)
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <Skeleton rows={4} height={36} />;
  if (error) return <ErrorState message={error} />;
  if (!data || data.records.length === 0) return <EmptyState title="No academic records yet" />;

  return (
    <div>
      <div className="profile-summary" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="profile-summary__item">
          <div className="profile-summary__label">Current Semester GPA</div>
          <strong>{data.currentSemesterGPA ?? '—'}</strong>
        </div>
        <div className="profile-summary__item">
          <div className="profile-summary__label">CGPA</div>
          <strong>{data.cgpa ?? '—'}</strong>
        </div>
        <div className="profile-summary__item">
          <div className="profile-summary__label">Arrears (current)</div>
          <strong>{data.records.filter((r) => r.isArrear).length}</strong>
        </div>
      </div>

      {data.trend.length > 1 && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <h3>Semester Trend</h3>
          <DataTable
            columns={[
              { key: 'semester', header: 'Semester' },
              { key: 'gpa', header: 'GPA' },
              { key: 'arrears', header: 'Arrears' },
              { key: 'subjectCount', header: 'Subjects' },
            ]}
            rows={data.trend.map((t) => ({ ...t, _id: t.semester }))}
          />
        </div>
      )}

      <h3>Subject Performance — Semester {data.records[0]?.semester}</h3>
      <DataTable
        columns={[
          { key: 'subject', header: 'Subject' },
          { key: 'internalMarks', header: 'Internal' },
          { key: 'examMarks', header: 'Exam' },
          { key: 'grade', header: 'Grade' },
          {
            key: 'isArrear',
            header: 'Status',
            render: (r) => (r.isArrear ? <Badge status="Critical">Arrear</Badge> : <Badge status="Stable">Cleared</Badge>),
          },
        ]}
        rows={data.records}
      />
    </div>
  );
}
