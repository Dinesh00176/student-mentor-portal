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

  const load = () => {
    setLoading(true);
    getStudentAcademics(studentId)
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [studentId]);

  if (loading) return <Skeleton rows={4} height={36} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data || data.records.length === 0) return <EmptyState title="No academic records yet" />;

  const currentArrears = data.records.filter((r) => r.isArrear).length;

  return (
    <div>
      <div className="profile-summary">
        <div className="profile-summary__item">
          <div className="profile-summary__label">Current Semester GPA</div>
          <div className="profile-summary__value tabular-nums">{data.currentSemesterGPA ?? '—'}</div>
        </div>
        <div className="profile-summary__item">
          <div className="profile-summary__label">Overall CGPA</div>
          <div className="profile-summary__value tabular-nums">{data.cgpa ?? '—'}</div>
        </div>
        <div className="profile-summary__item">
          <div className="profile-summary__label">Active Arrears</div>
          <div className="profile-summary__value tabular-nums" style={{ color: currentArrears > 0 ? 'var(--color-critical)' : 'var(--color-stable)' }}>
            {currentArrears}
          </div>
        </div>
      </div>

      {data.trend && data.trend.length > 1 && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Semester-by-Semester Progression</h3>
          <DataTable
            columns={[
              { key: 'semester', header: 'Semester', render: (r) => `Semester ${r.semester}` },
              { key: 'gpa', header: 'SGPA', render: (r) => <strong className="tabular-nums">{r.gpa}</strong> },
              {
                key: 'arrears',
                header: 'Arrears',
                render: (r) => (
                  <span className="tabular-nums" style={{ color: r.arrears > 0 ? 'var(--color-critical)' : 'var(--color-ink-muted)' }}>
                    {r.arrears}
                  </span>
                ),
              },
              { key: 'subjectCount', header: 'Enrolled Subjects', render: (r) => <span className="tabular-nums">{r.subjectCount}</span> },
            ]}
            rows={data.trend.map((t) => ({ ...t, _id: t.semester }))}
          />
        </div>
      )}

      <h3 style={{ marginBottom: 'var(--space-3)' }}>Subject Performance — Semester {data.records[0]?.semester}</h3>
      <DataTable
        columns={[
          { key: 'subject', header: 'Subject Code / Title' },
          { key: 'internalMarks', header: 'Internal', render: (r) => <span className="tabular-nums">{r.internalMarks ?? '—'}</span> },
          { key: 'examMarks', header: 'End Sem Exam', render: (r) => <span className="tabular-nums">{r.examMarks ?? '—'}</span> },
          { key: 'grade', header: 'Grade', render: (r) => <strong>{r.grade || '—'}</strong> },
          {
            key: 'isArrear',
            header: 'Result',
            render: (r) => (r.isArrear ? <Badge status="Critical">Arrear</Badge> : <Badge status="Stable">Passed</Badge>),
          },
        ]}
        rows={data.records}
      />
    </div>
  );
}
