import { useEffect, useState } from 'react';
import { listInterventions } from '../../services/intervention.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';

export default function StudentInterventions() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listInterventions()
      .then(({ data }) => setItems(data.data.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton rows={4} height={50} />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1>Support &amp; Interventions</h1>
      {items.length === 0 ? <EmptyState title="No active support interventions." /> : (
        <div className="record-list">
          {items.map((iv) => (
            <div key={iv._id} className="record-card">
              <div className="record-card__title-row">
                <strong>{iv.interventionType}</strong>
                <Badge status={iv.status} />
              </div>
              <div className="record-card__meta">Assigned to {iv.assignedTo?.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
