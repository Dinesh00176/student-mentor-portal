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

  useEffect(() => {
    listInterventions()
      .then(({ data }) => setItems(data.data.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton rows={4} height={40} />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1>Assigned Cases</h1>
      {items.length === 0 ? <EmptyState title="No cases assigned to you." /> : (
        <DataTable
          columns={[
            { key: 'student', header: 'Student', render: (r) => r.student?.studentCode },
            { key: 'interventionType', header: 'Type' },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
          ]}
          rows={items}
        />
      )}
    </div>
  );
}
