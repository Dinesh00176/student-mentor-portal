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

  useEffect(() => {
    setLoading(true);
    listInterventions({ status })
      .then(({ data }) => setResult(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <h1>Interventions</h1>
      <div style={{ maxWidth: 240, marginBottom: 'var(--space-4)' }}>
        <Field label="Filter by status" htmlFor="status">
          <Select id="status" placeholder="All statuses" value={status} onChange={(e) => setStatus(e.target.value)}
            options={STATUSES.map((s) => ({ value: s, label: s }))} />
        </Field>
      </div>

      {loading && <Skeleton rows={4} height={40} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && result && result.items.length === 0 && <EmptyState title="No interventions recorded." />}
      {!loading && !error && result && result.items.length > 0 && (
        <DataTable
          columns={[
            { key: 'student', header: 'Student', render: (r) => r.student?.studentCode },
            { key: 'interventionType', header: 'Type' },
            { key: 'assignedTo', header: 'Assigned To', render: (r) => r.assignedTo?.name },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
          ]}
          rows={result.items}
          onRowClick={(r) => navigate(`/mentor/students/${r.student?._id}`)}
        />
      )}
    </div>
  );
}
