import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCounselingSessions } from '../../services/counseling.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import { Field, Select } from '../../components/FormField';

const STATUSES = ['Scheduled', 'Completed', 'Follow-up Required', 'Closed'];

export default function MentorCounseling() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    listCounselingSessions({ status })
      .then(({ data }) => setResult(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Counseling &amp; Wellness Log</h1>
          <p className="page-header__subtitle">Review guidance sessions scheduled and conducted for your cohort.</p>
        </div>
      </div>

      <div className="record-card" style={{ maxWidth: 280, marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}>
        <Field label="Filter by Session Status" htmlFor="status">
          <Select
            id="status"
            placeholder="All session statuses"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUSES.map((s) => ({ value: s, label: s }))}
          />
        </Field>
      </div>

      {loading && <Skeleton rows={4} height={40} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && result && result.items.length === 0 && (
        <EmptyState
          title="No counseling sessions found"
          description={status ? 'No sessions match this status filter.' : 'No counseling sessions logged for your students.'}
        />
      )}
      {!loading && !error && result && result.items.length > 0 && (
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
            {
              key: 'date',
              header: 'Session Date',
              render: (r) => <span className="tabular-nums">{new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>,
            },
            { key: 'sessionType', header: 'Session Type', render: (r) => <strong>{r.sessionType}</strong> },
            { key: 'reason', header: 'Topic / Reason', render: (r) => r.reason },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} size="sm" /> },
          ]}
          rows={result.items}
          onRowClick={(r) => navigate(`/mentor/students/${r.student?._id}`)}
        />
      )}
    </div>
  );
}
