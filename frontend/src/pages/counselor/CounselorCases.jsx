import { useEffect, useState } from 'react';
import { listInterventions } from '../../services/intervention.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';

export default function CounselorCases() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    listInterventions()
      .then(({ data }) => setItems(data.data.items || []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <Skeleton rows={4} height={40} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Counseling Caseload &amp; Referrals</h1>
          <p className="page-header__subtitle">Assigned counseling referrals, behavioral follow-ups, and student intervention cases.</p>
        </div>
      </div>

      <div className="confidentiality-notice">
        <span className="confidentiality-notice__icon" aria-hidden="true">🔒</span>
        <span>
          <strong>Confidential Case Vault:</strong> Cases listed below are confidential and managed by the student wellness department.
        </span>
      </div>

      {!items || items.length === 0 ? (
        <EmptyState
          title="No active counseling cases assigned"
          description="Referrals from faculty mentors or academic heads will appear here."
        />
      ) : (
        <DataTable
          columns={[
            {
              key: 'student',
              header: 'Student',
              render: (r) => (
                <div>
                  <strong style={{ color: 'var(--color-accent-strong)' }}>{r.student?.user?.name || r.student?.studentCode}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-faint)', marginLeft: 6, fontFamily: 'var(--font-mono)' }}>
                    ({r.student?.studentCode})
                  </span>
                </div>
              ),
            },
            { key: 'interventionType', header: 'Case Type', render: (r) => <strong>{r.interventionType}</strong> },
            { key: 'problemIdentified', header: 'Referral Reason / Area', render: (r) => r.problemIdentified },
            { key: 'actionTaken', header: 'Counseling Action Plan', render: (r) => r.actionTaken || '—' },
            {
              key: 'followUpDate',
              header: 'Follow-up Target',
              render: (r) => r.followUpDate ? <span className="tabular-nums">{new Date(r.followUpDate).toLocaleDateString()}</span> : '—',
            },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} size="sm" /> },
          ]}
          rows={items}
        />
      )}
    </div>
  );
}
