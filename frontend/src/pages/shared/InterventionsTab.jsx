import { useEffect, useState } from 'react';
import { listInterventions, createIntervention, updateInterventionStatus } from '../../services/intervention.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, Select, TextArea } from '../../components/FormField';

const TYPES = ['Academic Support', 'Attendance Support', 'Counseling Referral', 'Peer Support', 'Parental Involvement', 'Other'];
const STATUSES = ['Open', 'In Progress', 'Follow-up', 'Resolved', 'Closed'];

export default function InterventionsTab({ studentId, canManage }) {
  const { push } = useToast();
  const [interventions, setInterventions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ problemIdentified: '', interventionType: 'Academic Support', actionTaken: '', followUpDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [statusEdits, setStatusEdits] = useState({});

  const load = () => {
    setLoading(true);
    listInterventions({ student: studentId })
      .then(({ data }) => setInterventions(data.data.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createIntervention({ student: studentId, ...form });
      push('Intervention created successfully.');
      setShowModal(false);
      setForm({ problemIdentified: '', interventionType: 'Academic Support', actionTaken: '', followUpDate: '' });
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateInterventionStatus(id, { status });
      push('Intervention status updated.');
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 style={{ margin: 0 }}>Targeted Interventions &amp; Support</h3>
          <p className="page-header__subtitle">Action items and support plans assigned to this student.</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setShowModal(true)}>
            + New Intervention
          </Button>
        )}
      </div>

      {loading && <Skeleton rows={3} height={80} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && interventions && interventions.length === 0 && (
        <EmptyState
          title="No active interventions recorded"
          description="Click 'New Intervention' to assign academic or counseling support."
          action={canManage ? <Button size="sm" onClick={() => setShowModal(true)}>Create First Intervention</Button> : null}
        />
      )}
      {!loading && !error && interventions && interventions.length > 0 && (
        <div className="record-list">
          {interventions.map((iv) => (
            <div key={iv._id} className="record-card">
              <div className="record-card__title-row">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{iv.interventionType}</strong>
                    <Badge status={iv.status} size="sm" />
                  </div>
                  <div className="record-card__meta" style={{ marginTop: 2 }}>
                    Assigned to {iv.assignedTo?.name || 'Mentor'} · Created {new Date(iv.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="record-card__body" style={{ marginTop: 'var(--space-2)' }}>
                <strong>Identified Need:</strong> {iv.problemIdentified}
              </div>
              {iv.actionTaken && (
                <div className="record-card__body" style={{ marginTop: 6, color: 'var(--color-ink)' }}>
                  <strong>Action Plan:</strong> {iv.actionTaken}
                </div>
              )}
              {iv.followUpDate && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-attention-strong)', marginTop: 6, fontWeight: 600 }}>
                  📅 Follow-up Target: {new Date(iv.followUpDate).toLocaleDateString()}
                </div>
              )}

              {canManage && (
                <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-faint)', fontWeight: 600 }}>Update Status:</span>
                  <div style={{ width: 140 }}>
                    <Select
                      value={statusEdits[iv._id] || iv.status}
                      onChange={(e) => setStatusEdits({ ...statusEdits, [iv._id]: e.target.value })}
                      options={STATUSES.map((s) => ({ value: s, label: s }))}
                    />
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => handleStatusChange(iv._id, statusEdits[iv._id] || iv.status)}>
                    Save Status
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Create Targeted Intervention" onClose={() => setShowModal(false)} size="md">
          <form onSubmit={handleSubmit}>
            <Field label="Identified Problem / Area of Concern" htmlFor="problem" required>
              <TextArea
                id="problem"
                required
                placeholder="Describe the academic, attendance, or behavioral issue observed..."
                value={form.problemIdentified}
                onChange={(e) => setForm({ ...form, problemIdentified: e.target.value })}
              />
            </Field>
            <Field label="Intervention Type" htmlFor="type">
              <Select
                id="type"
                value={form.interventionType}
                onChange={(e) => setForm({ ...form, interventionType: e.target.value })}
                options={TYPES.map((t) => ({ value: t, label: t }))}
              />
            </Field>
            <Field label="Action Plan / Steps Taken" htmlFor="action">
              <TextArea
                id="action"
                placeholder="What action steps will be taken with the student?"
                value={form.actionTaken}
                onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
              />
            </Field>
            <Field label="Target Follow-up Date" htmlFor="followUpDate">
              <Input
                id="followUpDate"
                type="date"
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              />
            </Field>
            <Button type="submit" loading={submitting} fullWidth size="lg">
              Save Intervention Plan
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
