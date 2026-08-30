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

  useEffect(() => {
    listCounselingSessions()
      .then(({ data }) => setSessions(data.data.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton rows={4} height={50} />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1>My Counseling Sessions</h1>
      {sessions.length === 0 ? <EmptyState title="No counseling sessions scheduled." /> : (
        <div className="record-list">
          {sessions.map((s) => (
            <div key={s._id} className="record-card">
              <div className="record-card__title-row">
                <strong>{s.sessionType} session</strong>
                <Badge status={s.status} />
              </div>
              <div className="record-card__meta">{new Date(s.date).toDateString()}</div>
              <div className="record-card__body">{s.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
