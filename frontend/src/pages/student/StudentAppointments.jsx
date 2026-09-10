import { useEffect, useState } from 'react';
import { listAppointments, createAppointment } from '../../services/appointment.service';
import { getStudentDashboard } from '../../services/dashboard.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, TextArea } from '../../components/FormField';

export default function StudentAppointments() {
  const { push } = useToast();
  const [items, setItems] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ reason: '', preferredDate: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([listAppointments(), getStudentDashboard()])
      .then(([aRes, dRes]) => {
        setItems(aRes.data.data || []);
        setMentor(dRes.data.data?.student?.assignedMentor);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mentor?._id) {
      push('You do not have an assigned faculty mentor yet. Please contact your department head.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createAppointment({ withUser: mentor._id, reason: form.reason, preferredDate: form.preferredDate });
      push('Meeting request submitted to your mentor.');
      setShowModal(false);
      setForm({ reason: '', preferredDate: '' });
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton rows={4} height={50} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Mentoring Sessions</h1>
          <p className="page-header__subtitle">Request and view status of 1-on-1 sessions with your faculty mentor.</p>
        </div>
        {mentor ? (
          <Button onClick={() => setShowModal(true)}>
            + Book Meeting Request
          </Button>
        ) : (
          <span style={{ fontSize: '0.85rem', color: 'var(--color-ink-faint)' }}>Faculty mentor unassigned</span>
        )}
      </div>

      {!items || items.length === 0 ? (
        <EmptyState
          title="No meeting requests yet"
          description="Have questions about academics or coursework? Request a mentoring session."
          action={mentor ? <Button size="sm" onClick={() => setShowModal(true)}>Request First Meeting</Button> : null}
        />
      ) : (
        <div className="record-list">
          {items.map((a) => (
            <div key={a._id} className="record-card">
              <div className="record-card__title-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: '0.95rem' }}>Meeting with {a.withUser?.name || 'Mentor'}</strong>
                  <Badge status={a.status} size="sm" />
                </div>
                <div className="record-card__meta tabular-nums">
                  Preferred: {new Date(a.preferredDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              <div className="record-card__body" style={{ marginTop: 'var(--space-2)' }}>
                <strong>Topic / Discussion Area:</strong> {a.reason}
              </div>

              {a.confirmedDate && (
                <div style={{ marginTop: 6, fontSize: '0.85rem', color: 'var(--color-stable-strong)', fontWeight: 600 }}>
                  ✓ Scheduled Date: {new Date(a.confirmedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              )}

              {a.notes && (
                <div className="record-card__body" style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--color-ink-muted)' }}>
                  Mentor Notes: {a.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && mentor && (
        <Modal title={`Book Meeting with ${mentor.name}`} onClose={() => setShowModal(false)} size="sm">
          <form onSubmit={handleSubmit}>
            <Field label="Discussion Topic / Reason" htmlFor="reason" required hint="What would you like guidance on?">
              <TextArea
                id="reason"
                required
                placeholder="e.g. Subject difficulty in DSA, internship preparation..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </Field>
            <Field label="Preferred Date" htmlFor="preferredDate" required>
              <Input
                id="preferredDate"
                type="date"
                required
                value={form.preferredDate}
                onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
              />
            </Field>
            <Button type="submit" loading={submitting} fullWidth size="lg">
              Submit Meeting Request
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
