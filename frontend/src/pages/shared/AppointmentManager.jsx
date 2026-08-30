import { useEffect, useState } from 'react';
import { listAppointments, updateAppointmentStatus } from '../../services/appointment.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, TextArea } from '../../components/FormField';

// Shared between /mentor/appointments and /counselor/appointments - requests
// are already scoped server-side to the current user (withUser === self).
export default function AppointmentManager() {
  const { push } = useToast();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [notes, setNotes] = useState('');

  const load = () => {
    setLoading(true);
    listAppointments()
      .then(({ data }) => setItems(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatus = async (id, status, extra = {}) => {
    try {
      await updateAppointmentStatus(id, { status, ...extra });
      push(`Appointment marked ${status}.`);
      setRescheduleTarget(null);
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <Skeleton rows={4} height={70} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h1>Meeting Requests</h1>
      {items.length === 0 ? <EmptyState title="No meeting requests." /> : (
        <div className="record-list">
          {items.map((a) => (
            <div key={a._id} className="record-card">
              <div className="record-card__title-row">
                <div>
                  <strong>{a.student?.studentCode}</strong>
                  <div className="record-card__meta">Requested: {new Date(a.preferredDate).toDateString()}</div>
                </div>
                <Badge status={a.status} />
              </div>
              <div className="record-card__body">{a.reason}</div>
              {a.status === 'Pending' && (
                <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button size="sm" onClick={() => handleStatus(a._id, 'Confirmed', { confirmedDate: a.preferredDate })}>Accept</Button>
                  <Button size="sm" variant="secondary" onClick={() => setRescheduleTarget(a._id)}>Reschedule</Button>
                  <Button size="sm" variant="danger" onClick={() => handleStatus(a._id, 'Rejected')}>Reject</Button>
                </div>
              )}
              {a.status === 'Confirmed' && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <Button size="sm" onClick={() => handleStatus(a._id, 'Completed')}>Mark Completed</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rescheduleTarget && (
        <Modal title="Reschedule Meeting" onClose={() => setRescheduleTarget(null)}>
          <Field label="New Date" htmlFor="newDate" required>
            <Input id="newDate" type="date" required value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <TextArea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Button
            style={{ width: '100%' }}
            onClick={() => handleStatus(rescheduleTarget, 'Confirmed', { confirmedDate: rescheduleDate, notes })}
            disabled={!rescheduleDate}
          >
            Confirm New Date
          </Button>
        </Modal>
      )}
    </div>
  );
}
