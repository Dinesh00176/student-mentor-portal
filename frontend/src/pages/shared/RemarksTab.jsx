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
      push('Remark added.');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ margin: 0 }}>Mentor Remarks</h3>
        {canCreate && <Button size="sm" onClick={() => setShowModal(true)}>Add Remark</Button>}
      </div>

      {loading && <Skeleton rows={3} height={50} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && remarks && remarks.length === 0 && <EmptyState title="No mentor remarks yet." />}
      {!loading && !error && remarks && remarks.length > 0 && (
        <div className="record-list">
          {remarks.map((r) => (
            <div key={r._id} className="record-card">
              <div className="record-card__title-row">
                <strong>{r.category}</strong>
                <span className="record-card__meta">{new Date(r.createdAt).toDateString()} · {r.mentor?.name}</span>
              </div>
              <div className="record-card__body">{r.content}</div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Add Mentor Remark" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <Field label="Category" htmlFor="category">
              <Select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </Field>
            <Field label="Remark" htmlFor="content" required>
              <TextArea id="content" required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </Field>
            <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Saving…' : 'Save Remark'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
