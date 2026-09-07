import { useEffect, useState } from 'react';
import { listCounselingSessions } from '../../services/counseling.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';

export default function StudentCounseling() {
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    listCounselingSessions()
      .then(({ data }) => setSessions(data.data.items || []))
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
          <h1>My Counseling &amp; Wellness Sessions</h1>
          <p className="page-header__subtitle">Private wellness, stress management, and guidance session history.</p>
        </div>
      </div>

      <div className="confidentiality-notice">
        <span className="confidentiality-notice__icon" aria-hidden="true">🔒</span>
        <span>
          <strong>Confidential &amp; Private:</strong> All counseling discussions are strictly confidential and governed by institutional wellness policies.
        </span>
      </div>

      {!sessions || sessions.length === 0 ? (
        <EmptyState
          title="No counseling sessions scheduled"
          description="If you would like confidential personal, academic, or career guidance, please reach out to your department counselor."
        />
      ) : (
        <div className="record-list">
          {sessions.map((s) => (
            <div key={s._id} className="record-card" style={{ borderLeft: '3px solid var(--color-info)' }}>
              <div className="record-card__title-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: '0.95rem' }}>{s.sessionType} Counseling Session</strong>
                  <Badge status={s.status} size="sm" />
                </div>
                <div className="record-card__meta tabular-nums">
                  {new Date(s.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div className="record-card__body" style={{ marginTop: 'var(--space-2)' }}>
                <strong>Topic / Session Focus:</strong> {s.reason}
              </div>
              {s.discussionSummary && (
                <div className="record-card__body" style={{ marginTop: 4, color: 'var(--color-ink-muted)' }}>
                  {s.discussionSummary}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
