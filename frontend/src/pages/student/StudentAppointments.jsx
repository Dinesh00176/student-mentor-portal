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
        setItems(aRes.data.data);
        setMentor(dRes.data.data.student.assignedMentor);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAppointment({ withUser: mentor._id, reason: form.reason, preferredDate: form.preferredDate });
      push('Meeting request sent.');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h1>Meeting Requests</h1>
        {mentor ? (
          <Button onClick={() => setShowModal(true)}>Request Meeting</Button>
        ) : (
          <span style={{ fontSize: '0.85rem', color: 'var(--color-ink-faint)' }}>No mentor assigned yet.</span>
        )}
      </div>

      {items.length === 0 ? <EmptyState title="No meeting requests yet." /> : (
        <div className="record-list">
          {items.map((a) => (
            <div key={a._id} className="record-card">
              <div className="record-card__title-row">
                <strong>With {a.withUser?.name}</strong>
                <Badge status={a.status} />
              </div>
              <div className="record-card__meta">Preferred: {new Date(a.preferredDate).toDateString()}</div>
              <div className="record-card__body">{a.reason}</div>
            </div>
          ))}
        </div>
      )}

      {showModal && mentor && (
        <Modal title={`Request Meeting with ${mentor.name}`} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <Field label="Reason" htmlFor="reason" required>
              <TextArea id="reason" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </Field>
            <Field label="Preferred Date" htmlFor="preferredDate" required>
              <Input id="preferredDate" type="date" required value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} />
            </Field>
            <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Sending…' : 'Send Request'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
