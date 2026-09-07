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
      push('Counseling session scheduled successfully.');
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
      {/* Confidentiality Reassurance Banner */}
      <div className="confidentiality-notice">
        <span className="confidentiality-notice__icon" aria-hidden="true">🔒</span>
        <span>
          <strong>Confidential Case Vault:</strong> Counseling notes and session details are private and accessible only to authorized counselors and administrators.
        </span>
      </div>

      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 style={{ margin: 0 }}>Counseling &amp; Wellness History</h3>
          <p className="page-header__subtitle">Confidential record of guidance sessions and wellness interventions.</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setShowModal(true)}>
            + Schedule Session
          </Button>
        )}
      </div>

      {loading && <Skeleton rows={3} height={65} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && sessions && sessions.length === 0 && (
        <EmptyState
          title="No counseling sessions scheduled"
          description="No counseling history found for this student."
          action={canCreate ? <Button size="sm" onClick={() => setShowModal(true)}>Schedule Session</Button> : null}
        />
      )}
      {!loading && !error && sessions && sessions.length > 0 && (
        <div className="record-list">
          {sessions.map((s) => (
            <div key={s._id} className="record-card" style={{ borderLeft: '3px solid var(--color-info)' }}>
              <div className="record-card__title-row">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{s.sessionType} Guidance Session</strong>
                    <Badge status={s.status} size="sm" />
                  </div>
                  <div className="record-card__meta" style={{ marginTop: 2 }}>
                    📅 {new Date(s.date).toLocaleDateString()} · Conducted by {s.conductedBy?.name || 'Counselor'}
                  </div>
                </div>
              </div>
              <div className="record-card__body" style={{ marginTop: 'var(--space-2)' }}>
                <strong>Session Focus:</strong> {s.reason}
              </div>
              {s.discussionSummary && (
                <div className="record-card__body" style={{ marginTop: 6, color: 'var(--color-ink)' }}>
                  <strong>Summary:</strong> {s.discussionSummary}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Schedule Counseling Session" onClose={() => setShowModal(false)} size="md">
          <form onSubmit={handleSubmit}>
            <Field label="Session Type / Classification" htmlFor="sessionType">
              <Select
                id="sessionType"
                value={form.sessionType}
                onChange={(e) => setForm({ ...form, sessionType: e.target.value })}
                options={SESSION_TYPES.map((t) => ({ value: t, label: t }))}
              />
            </Field>
            <Field label="Reason / Referral Purpose" htmlFor="reason" required>
              <Input
                id="reason"
                required
                placeholder="e.g. Academic stress, career clarity..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </Field>
            <Field label="Discussion Summary / Counselor Notes" htmlFor="summary">
              <TextArea
                id="summary"
                placeholder="Key observations and guidance provided..."
                value={form.discussionSummary}
                onChange={(e) => setForm({ ...form, discussionSummary: e.target.value })}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Field label="Session Status" htmlFor="status">
                <Select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  options={STATUSES.map((t) => ({ value: t, label: t }))}
                />
              </Field>
              <Field label="Next Follow-up Date" htmlFor="followUpDate">
                <Input
                  id="followUpDate"
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                />
              </Field>
            </div>
            <Button type="submit" loading={submitting} fullWidth size="lg">
              Save Session Record
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
