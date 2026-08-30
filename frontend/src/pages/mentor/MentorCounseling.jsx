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

  useEffect(() => {
    setLoading(true);
    listCounselingSessions({ status })
      .then(({ data }) => setResult(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <h1>Counseling Sessions</h1>
      <div style={{ maxWidth: 240, marginBottom: 'var(--space-4)' }}>
        <Field label="Filter by status" htmlFor="status">
          <Select id="status" placeholder="All statuses" value={status} onChange={(e) => setStatus(e.target.value)}
            options={STATUSES.map((s) => ({ value: s, label: s }))} />
        </Field>
      </div>

      {loading && <Skeleton rows={4} height={40} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && result && result.items.length === 0 && <EmptyState title="No counseling sessions scheduled." />}
      {!loading && !error && result && result.items.length > 0 && (
        <DataTable
          columns={[
            { key: 'student', header: 'Student', render: (r) => r.student?.studentCode },
            { key: 'date', header: 'Date', render: (r) => new Date(r.date).toDateString() },
            { key: 'sessionType', header: 'Type' },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
          ]}
          rows={result.items}
          onRowClick={(r) => navigate(`/mentor/students/${r.student?._id}`)}
        />
      )}
    </div>
  );
}
