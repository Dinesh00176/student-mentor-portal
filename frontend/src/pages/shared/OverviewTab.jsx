import Badge from '../../components/Badge';

export default function OverviewTab({ student, attention }) {
  return (
    <div className="profile-rail">
      <div className="profile-rail__main">
        <h3>Attention Summary</h3>
        <p style={{ marginBottom: 'var(--space-3)' }}>
          <Badge status={attention.status} />
        </p>
        <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-2)' }}>
          This status is computed from transparent, rule-based signals below — not a prediction or diagnosis.
        </p>
        <ul className="reason-list">
          {attention.reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>
      <div className="profile-rail__side">
        <h3>Record</h3>
        <p style={{ fontSize: '0.88rem' }}>
          <strong>Department:</strong> {student.department?.name}<br />
          <strong>Year / Semester:</strong> Y{student.year} / S{student.semester}<br />
          <strong>Section:</strong> {student.section}<br />
          <strong>Mentor:</strong> {student.assignedMentor?.name || 'Unassigned'}<br />
          <strong>Enrollment:</strong> {student.enrollmentStatus}
        </p>
      </div>
    </div>
  );
}
