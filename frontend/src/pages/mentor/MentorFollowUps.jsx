import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listFollowUps, completeFollowUp } from '../../services/followup.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

export default function MentorFollowUps() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    listFollowUps()
      .then(({ data }) => setItems(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleComplete = async (id) => {
    try {
      await completeFollowUp(id);
      push('Follow-up marked complete.');
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <h1>Follow-ups</h1>
      {loading && <Skeleton rows={4} height={40} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && items && items.length === 0 && <EmptyState title="No follow-ups scheduled." />}
      {!loading && !error && items && items.length > 0 && (
        <DataTable
          columns={[
            { key: 'student', header: 'Student', render: (r) => r.student?.studentCode },
            { key: 'dueDate', header: 'Due', render: (r) => new Date(r.dueDate).toDateString() },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
            {
              key: 'actions',
              header: '',
              render: (r) => r.status !== 'Completed' && (
                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleComplete(r._id); }}>
                  Mark Complete
                </Button>
              ),
            },
          ]}
          rows={items}
          onRowClick={(r) => navigate(`/mentor/students/${r.student?._id}`)}
        />
      )}
    </div>
  );
}
