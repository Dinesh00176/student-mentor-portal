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

  const load = () => {
    setLoading(true);
    listInterventions()
      .then(({ data }) => setItems(data.data.items || []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <Skeleton rows={4} height={50} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Active Academic &amp; Attendance Support</h1>
          <p className="page-header__subtitle">Action plans and support initiatives arranged by your faculty mentor.</p>
        </div>
      </div>

      {!items || items.length === 0 ? (
        <EmptyState
          title="No active support interventions"
          description="You currently have no active intervention plans. Keep up the good progress!"
        />
      ) : (
        <div className="record-list">
          {items.map((iv) => (
            <div key={iv._id} className="record-card">
              <div className="record-card__title-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: '0.95rem' }}>{iv.interventionType}</strong>
                  <Badge status={iv.status} size="sm" />
                </div>
                <div className="record-card__meta tabular-nums">
                  Assigned by {iv.assignedTo?.name || 'Faculty Mentor'}
                </div>
              </div>

              {iv.problemIdentified && (
                <div className="record-card__body" style={{ marginTop: 'var(--space-2)' }}>
                  <strong>Identified Area:</strong> {iv.problemIdentified}
                </div>
              )}

              {iv.actionTaken && (
                <div className="record-card__body" style={{ marginTop: 4, color: 'var(--color-ink)' }}>
                  <strong>Action Plan:</strong> {iv.actionTaken}
                </div>
              )}

              {iv.followUpDate && (
                <div style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--color-attention-strong)', fontWeight: 600 }}>
                  📅 Next Check-in Date: {new Date(iv.followUpDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
