import Badge from '../../components/Badge';

export default function OverviewTab({ student, attention }) {
  return (
    <div className="profile-rail">
      <div className="profile-rail__main">
        <div className="record-card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="record-card__title-row">
            <h3 style={{ margin: 0 }}>Attention &amp; Risk Status</h3>
            <Badge status={attention.status} />
          </div>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.84rem', margin: 'var(--space-2) 0 var(--space-3)' }}>
            This status is computed from transparent, rule-based academic &amp; attendance signals:
          </p>
          <ul className="reason-list">
            {attention.reasons && attention.reasons.length > 0 ? (
              attention.reasons.map((r, i) => <li key={i}>{r}</li>)
            ) : (
              <li style={{ color: 'var(--color-stable-strong)' }}>All academic and attendance metrics are currently within stable thresholds.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="profile-rail__side">
        <div className="record-card">
          <h3 style={{ margin: '0 0 var(--space-3)' }}>Institutional Record</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--color-ink-faint)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Department</span>
              <strong>{student.department?.name || '—'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-ink-faint)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Class / Section</span>
              <strong>Year {student.year}, Sem {student.semester} — Sec {student.section || 'A'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-ink-faint)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Mentor</span>
              <strong>{student.assignedMentor?.name || 'Unassigned'}</strong>
              {student.assignedMentor?.email && (
                <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.8rem' }}>{student.assignedMentor.email}</div>
              )}
            </div>
            <div>
              <span style={{ color: 'var(--color-ink-faint)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Enrollment Status</span>
              <Badge status={student.enrollmentStatus === 'active' ? 'Stable' : student.enrollmentStatus} size="sm">
                {student.enrollmentStatus}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
