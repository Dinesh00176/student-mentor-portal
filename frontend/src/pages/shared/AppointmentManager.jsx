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

export default function AppointmentManager() {
  const { push } = useToast();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('All');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    listAppointments()
      .then(({ data }) => setItems(data.data || []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatus = async (id, status, extra = {}) => {
    setSubmitting(true);
    try {
      await updateAppointmentStatus(id, { status, ...extra });
      push(`Appointment marked as ${status}.`);
      setRescheduleTarget(null);
      setRescheduleDate('');
      setNotes('');
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton rows={4} height={70} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const filteredItems = items ? items.filter((a) => {
    if (filter === 'All') return true;
    return a.status === filter;
  }) : [];

  const pendingCount = items ? items.filter((a) => a.status === 'Pending').length : 0;
  const confirmedCount = items ? items.filter((a) => a.status === 'Confirmed').length : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Student Meeting Requests</h1>
          <p className="page-header__subtitle">Review, confirm, reschedule, or manage 1-on-1 student mentoring sessions.</p>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {['All', 'Pending', 'Confirmed', 'Completed', 'Rejected'].map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'primary' : 'secondary'}
            onClick={() => setFilter(f)}
          >
            {f}
            {f === 'Pending' && pendingCount > 0 && ` (${pendingCount})`}
            {f === 'Confirmed' && confirmedCount > 0 && ` (${confirmedCount})`}
          </Button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          title={`No ${filter === 'All' ? '' : filter.toLowerCase()} meeting requests`}
          description={filter === 'Pending' ? 'All student appointment requests have been addressed.' : 'No appointments matching this filter.'}
        />
      ) : (
        <div className="record-list">
          {filteredItems.map((a) => (
            <div key={a._id} className="record-card">
              <div className="record-card__title-row">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{a.student?.user?.name || a.student?.studentCode}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>({a.student?.studentCode})</span>
                    <Badge status={a.status} size="sm" />
                  </div>
                  <div className="record-card__meta" style={{ marginTop: 2 }}>
                    Requested Preferred Date: <strong>{new Date(a.preferredDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                  </div>
                </div>
              </div>

              <div className="record-card__body" style={{ marginTop: 'var(--space-2)' }}>
                <strong>Reason for Meeting:</strong> {a.reason}
              </div>

              {a.confirmedDate && (
                <div style={{ marginTop: 6, fontSize: '0.85rem', color: 'var(--color-stable-strong)', fontWeight: 600 }}>
                  ✓ Scheduled Session Date: {new Date(a.confirmedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              )}

              {a.notes && (
                <div className="record-card__body" style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--color-ink-muted)' }}>
                  Notes: {a.notes}
                </div>
              )}

              {a.status === 'Pending' && (
                <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button
                    size="sm"
                    loading={submitting}
                    onClick={() => handleStatus(a._id, 'Confirmed', { confirmedDate: a.preferredDate })}
                  >
                    Accept Preferred Date
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setRescheduleTarget(a._id);
                      setRescheduleDate(a.preferredDate ? new Date(a.preferredDate).toISOString().split('T')[0] : '');
                    }}
                  >
                    Reschedule to Other Date
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={submitting}
                    onClick={() => handleStatus(a._id, 'Rejected')}
                  >
                    Decline Request
                  </Button>
                </div>
              )}

              {a.status === 'Confirmed' && (
                <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)' }}>
                  <Button
                    size="sm"
                    loading={submitting}
                    onClick={() => handleStatus(a._id, 'Completed')}
                  >
                    Mark Meeting Completed
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rescheduleTarget && (
        <Modal title="Propose New Meeting Date" onClose={() => setRescheduleTarget(null)} size="sm">
          <Field label="Confirmed New Date" htmlFor="newDate" required hint="Select the new date for this mentoring session.">
            <Input
              id="newDate"
              type="date"
              required
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
            />
          </Field>
          <Field label="Response Notes / Guidance for Student" htmlFor="notes">
            <TextArea
              id="notes"
              placeholder="e.g. Please bring your semester marksheet and assignment reports..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          <Button
            fullWidth
            loading={submitting}
            onClick={() => handleStatus(rescheduleTarget, 'Confirmed', { confirmedDate: rescheduleDate, notes })}
            disabled={!rescheduleDate}
          >
            Confirm &amp; Notify Student
          </Button>
        </Modal>
      )}
    </div>
  );
}
