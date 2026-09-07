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
  const [completingId, setCompletingId] = useState(null);

  const load = () => {
    setLoading(true);
    listFollowUps()
      .then(({ data }) => setItems(data.data || []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleComplete = async (id) => {
    setCompletingId(id);
    try {
      await completeFollowUp(id);
      push('Follow-up marked as completed.');
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Follow-up Tasks &amp; Milestones</h1>
          <p className="page-header__subtitle">Track mandatory check-ins and academic verification dates for your cohort.</p>
        </div>
      </div>

      {loading && <Skeleton rows={4} height={40} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && items && items.length === 0 && (
        <EmptyState
          title="No follow-ups scheduled"
          description="All student follow-up checkpoints have been completed."
        />
      )}
      {!loading && !error && items && items.length > 0 && (
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
              key: 'dueDate',
              header: 'Target Due Date',
              render: (r) => {
                const isOverdue = new Date(r.dueDate) < new Date() && r.status !== 'Completed';
                return (
                  <span className="tabular-nums" style={{ color: isOverdue ? 'var(--color-critical)' : 'inherit', fontWeight: isOverdue ? 700 : 400 }}>
                    {new Date(r.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    {isOverdue && ' (Overdue)'}
                  </span>
                );
              },
            },
            { key: 'notes', header: 'Follow-up Context / Notes', render: (r) => r.notes || '—' },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} size="sm" /> },
            {
              key: 'actions',
              header: '',
              render: (r) => r.status !== 'Completed' && (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={completingId === r._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleComplete(r._id);
                  }}
                >
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
