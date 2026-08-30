import { useEffect, useState } from 'react';
import { listAuditLogs } from '../../services/auditLog.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';

export default function AdminAuditLog() {
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    listAuditLogs({ page, limit: 20 })
      .then(({ data }) => setResult(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1>Audit Log</h1>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: 'var(--space-4)' }}>
        A record of important administrative actions — who did what, to what, and when.
      </p>

      {loading && <Skeleton rows={6} height={40} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && result && result.items.length === 0 && <EmptyState title="No audit log entries yet." />}
      {!loading && !error && result && result.items.length > 0 && (
        <>
          <DataTable
            columns={[
              { key: 'createdAt', header: 'When', render: (r) => new Date(r.createdAt).toLocaleString() },
              { key: 'actor', header: 'Actor', render: (r) => `${r.actor?.name || 'Unknown'} (${r.actorRole})` },
              { key: 'action', header: 'Action' },
              { key: 'targetType', header: 'Target' },
              { key: 'details', header: 'Details' },
            ]}
            rows={result.items}
          />
          <Pagination pagination={result.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
