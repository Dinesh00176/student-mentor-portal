import { useEffect, useState } from 'react';
import { listAuditLogs } from '../../services/auditLog.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import Badge from '../../components/Badge';

export default function AdminAuditLog() {
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    listAuditLogs({ page, limit: 20 })
      .then(({ data }) => setResult(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>System Audit &amp; Governance Trail</h1>
          <p className="page-header__subtitle">
            Immutable log of administrative activities, role updates, mentor reassignments, and enrollment adjustments.
          </p>
        </div>
      </div>

      {loading && <Skeleton rows={6} height={40} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && result && result.items.length === 0 && <EmptyState title="No audit log entries recorded yet." />}
      {!loading && !error && result && result.items.length > 0 && (
        <>
          <DataTable
            columns={[
              {
                key: 'createdAt',
                header: 'Timestamp',
                render: (r) => <span className="tabular-nums">{new Date(r.createdAt).toLocaleString()}</span>,
              },
              {
                key: 'actor',
                header: 'Executed By',
                render: (r) => (
                  <div>
                    <strong>{r.actor?.name || 'System Admin'}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-faint)' }}>Role: {r.actorRole}</div>
                  </div>
                ),
              },
              {
                key: 'action',
                header: 'Action',
                render: (r) => <Badge status="info" size="sm">{r.action}</Badge>,
              },
              { key: 'targetType', header: 'Target Entity', render: (r) => <strong>{r.targetType}</strong> },
              {
                key: 'details',
                header: 'Action Parameters / Details',
                render: (r) => (
                  <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
                    {typeof r.details === 'object' ? JSON.stringify(r.details) : String(r.details || '—')}
                  </span>
                ),
              },
            ]}
            rows={result.items}
          />
          <Pagination pagination={result.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
