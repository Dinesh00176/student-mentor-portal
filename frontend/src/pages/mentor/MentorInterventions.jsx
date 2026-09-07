import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listInterventions } from '../../services/intervention.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import { Field, Select } from '../../components/FormField';

const STATUSES = ['Open', 'In Progress', 'Follow-up', 'Resolved', 'Closed'];

export default function MentorInterventions() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    listInterventions({ status })
      .then(({ data }) => setResult(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Interventions &amp; Support Plans</h1>
          <p className="page-header__subtitle">Manage academic support plans, attendance monitoring, and peer initiatives.</p>
        </div>
      </div>

      <div className="record-card" style={{ maxWidth: 280, marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}>
        <Field label="Filter by Intervention Status" htmlFor="status">
          <Select
            id="status"
            placeholder="All intervention statuses"
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
          title="No interventions found"
          description={status ? 'No interventions match this filter.' : 'No active or historical interventions for your students.'}
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
            { key: 'interventionType', header: 'Intervention Type', render: (r) => <strong>{r.interventionType}</strong> },
            { key: 'problemIdentified', header: 'Problem / Area', render: (r) => r.problemIdentified },
            { key: 'assignedTo', header: 'Assigned Faculty', render: (r) => r.assignedTo?.name || 'Mentor' },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} size="sm" /> },
          ]}
          rows={result.items}
          onRowClick={(r) => navigate(`/mentor/students/${r.student?._id}`)}
        />
      )}
    </div>
  );
}
