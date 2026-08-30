import { useEffect, useState } from 'react';
import { listCounselingSessions, createCounselingSession } from '../../services/counseling.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, Select, TextArea } from '../../components/FormField';

const SESSION_TYPES = ['Academic', 'Personal', 'Career', 'Behavioral', 'General'];
const STATUSES = ['Scheduled', 'Completed', 'Follow-up Required', 'Closed'];

export default function CounselingTab({ studentId, canCreate }) {
  const { push } = useToast();
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ sessionType: 'General', reason: '', discussionSummary: '', status: 'Scheduled', followUpDate: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    listCounselingSessions({ student: studentId })
      .then(({ data }) => setSessions(data.data.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCounselingSession({ student: studentId, ...form });
      push('Counseling session scheduled.');
      setShowModal(false);
      setForm({ sessionType: 'General', reason: '', discussionSummary: '', status: 'Scheduled', followUpDate: '' });
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ margin: 0 }}>Counseling History</h3>
        {canCreate && <Button size="sm" onClick={() => setShowModal(true)}>Schedule Session</Button>}
      </div>

      {loading && <Skeleton rows={3} height={60} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && sessions && sessions.length === 0 && (
        <EmptyState title="No counseling sessions scheduled." />
      )}
      {!loading && !error && sessions && sessions.length > 0 && (
        <div className="record-list">
          {sessions.map((s) => (
            <div key={s._id} className="record-card">
              <div className="record-card__title-row">
                <div>
                  <strong>{s.sessionType} session</strong>
                  <div className="record-card__meta">{new Date(s.date).toDateString()} · Conducted by {s.conductedBy?.name}</div>
                </div>
                <Badge status={s.status} />
              </div>
              <div className="record-card__body">{s.reason}</div>
              {s.discussionSummary && <div className="record-card__body" style={{ marginTop: 6 }}>{s.discussionSummary}</div>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Schedule Counseling Session" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <Field label="Session Type" htmlFor="sessionType">
              <Select id="sessionType" value={form.sessionType} onChange={(e) => setForm({ ...form, sessionType: e.target.value })}
                options={SESSION_TYPES.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Reason" htmlFor="reason" required>
              <Input id="reason" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </Field>
            <Field label="Discussion Summary" htmlFor="summary">
              <TextArea id="summary" value={form.discussionSummary} onChange={(e) => setForm({ ...form, discussionSummary: e.target.value })} />
            </Field>
            <Field label="Status" htmlFor="status">
              <Select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={STATUSES.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Follow-up Date" htmlFor="followUpDate">
              <Input id="followUpDate" type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
            </Field>
            <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Saving…' : 'Save Session'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
