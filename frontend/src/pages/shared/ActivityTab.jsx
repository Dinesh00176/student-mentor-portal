import { useEffect, useState } from 'react';
import { getStudentActivity } from '../../services/student.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import Timeline from '../../components/Timeline';

export default function ActivityTab({ studentId }) {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getStudentActivity(studentId)
      .then(({ data }) => setEvents(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <Skeleton rows={5} height={40} />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h3>Activity Timeline</h3>
      <Timeline events={events} />
    </div>
  );
}
