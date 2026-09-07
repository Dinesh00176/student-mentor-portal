import { useEffect, useState } from 'react';
import { getStudentRemarks, createRemark } from '../../services/remark.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Select, TextArea } from '../../components/FormField';

const CATEGORIES = ['Academic', 'Attendance', 'General', 'Improvement', 'Follow-up'];

export default function RemarksTab({ studentId, canCreate }) {
  const { push } = useToast();
  const [remarks, setRemarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: 'General', content: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getStudentRemarks(studentId)
      .then(({ data }) => setRemarks(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createRemark({ student: studentId, ...form });
      push('Remark logged successfully.');
      setShowModal(false);
      setForm({ category: 'General', content: '' });
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 style={{ margin: 0 }}>Mentor Remarks &amp; Meeting Logs</h3>
          <p className="page-header__subtitle">Running log of observations, interactions, and student progress notes.</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setShowModal(true)}>
            + Add Remark
          </Button>
        )}
      </div>

      {loading && <Skeleton rows={3} height={60} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && remarks && remarks.length === 0 && (
        <EmptyState
          title="No mentor remarks recorded yet"
          description="Add a remark after meeting or reviewing this student's progress."
          action={canCreate ? <Button size="sm" onClick={() => setShowModal(true)}>Log First Remark</Button> : null}
        />
      )}
      {!loading && !error && remarks && remarks.length > 0 && (
        <div className="record-list">
          {remarks.map((r) => (
            <div key={r._id} className="record-card">
              <div className="record-card__title-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', background: 'var(--color-accent-tint)', color: 'var(--color-accent-strong)', padding: '2px 8px', borderRadius: 'var(--radius-xs)' }}>
                    {r.category}
                  </span>
                  <strong style={{ fontSize: '0.9rem' }}>{r.mentor?.name || 'Mentor'}</strong>
                </div>
                <span className="record-card__meta tabular-nums">{new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="record-card__body" style={{ marginTop: 'var(--space-2)', color: 'var(--color-ink)' }}>
                {r.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Log Mentor Remark" onClose={() => setShowModal(false)} size="md">
          <form onSubmit={handleSubmit}>
            <Field label="Remark Category" htmlFor="category">
              <Select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </Field>
            <Field label="Observation / Remark Details" htmlFor="content" required>
              <TextArea
                id="content"
                required
                placeholder="Document your discussion, guidance provided, or progress observation..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </Field>
            <Button type="submit" loading={submitting} fullWidth size="lg">
              Save Mentor Remark
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
