import { useEffect, useState } from 'react';
import { getStudentRemarks, createRemark, updateRemark } from '../../services/remark.service';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Select, TextArea } from '../../components/FormField';

const CATEGORIES = ['Academic', 'Attendance', 'General', 'Improvement', 'Follow-up'];

export default function RemarksTab({ studentId, canCreate }) {
  const { user } = useAuth();
  const { push } = useToast();
  const [remarks, setRemarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRemark, setEditingRemark] = useState(null);
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

  const handleOpenAdd = () => {
    setEditingRemark(null);
    setForm({ category: 'General', content: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (r) => {
    setEditingRemark(r);
    setForm({ category: r.category || 'General', content: r.content || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) {
      push('Observation details are required.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (editingRemark) {
        await updateRemark(editingRemark._id, { category: form.category, content: form.content.trim() });
        push('Remark updated successfully.');
      } else {
        await createRemark({ student: studentId, category: form.category, content: form.content.trim() });
        push('Remark logged successfully.');
      }
      setShowModal(false);
      setEditingRemark(null);
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
          <Button size="sm" onClick={handleOpenAdd}>
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
          action={canCreate ? <Button size="sm" onClick={handleOpenAdd}>Log First Remark</Button> : null}
        />
      )}
      {!loading && !error && remarks && remarks.length > 0 && (
        <div className="record-list">
          {remarks.map((r) => {
            const currentUserId = user?._id || user?.id;
            const isAuthor = user?.role === 'admin' || String(r.mentor?._id || r.mentor) === String(currentUserId);
            return (
              <div key={r._id} className="record-card">
                <div className="record-card__title-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', background: 'var(--color-accent-tint)', color: 'var(--color-accent-strong)', padding: '2px 8px', borderRadius: 'var(--radius-xs)' }}>
                      {r.category}
                    </span>
                    <strong style={{ fontSize: '0.9rem' }}>{r.mentor?.name || 'Mentor'}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className="record-card__meta tabular-nums">{new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {canCreate && isAuthor && (
                      <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(r)}>
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
                <div className="record-card__body" style={{ marginTop: 'var(--space-2)', color: 'var(--color-ink)' }}>
                  {r.content}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal
          title={editingRemark ? 'Edit Mentor Remark' : 'Log Mentor Remark'}
          onClose={() => {
            setShowModal(false);
            setEditingRemark(null);
          }}
          size="md"
        >
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
              {editingRemark ? 'Update Mentor Remark' : 'Save Mentor Remark'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
