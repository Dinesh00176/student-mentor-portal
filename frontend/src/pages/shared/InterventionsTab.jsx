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
      push('Intervention created.');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ margin: 0 }}>Interventions</h3>
        {canManage && <Button size="sm" onClick={() => setShowModal(true)}>New Intervention</Button>}
      </div>

      {loading && <Skeleton rows={3} height={70} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && interventions && interventions.length === 0 && <EmptyState title="No interventions recorded." />}
      {!loading && !error && interventions && interventions.length > 0 && (
        <div className="record-list">
          {interventions.map((iv) => (
            <div key={iv._id} className="record-card">
              <div className="record-card__title-row">
                <div>
                  <strong>{iv.interventionType}</strong>
                  <div className="record-card__meta">Assigned to {iv.assignedTo?.name} · Created {new Date(iv.createdAt).toDateString()}</div>
                </div>
                <Badge status={iv.status} />
              </div>
              <div className="record-card__body">{iv.problemIdentified}</div>
              {iv.actionTaken && <div className="record-card__body" style={{ marginTop: 6 }}><strong>Action:</strong> {iv.actionTaken}</div>}
              {canManage && (
                <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Select
                    value={statusEdits[iv._id] || iv.status}
                    onChange={(e) => setStatusEdits({ ...statusEdits, [iv._id]: e.target.value })}
                    options={STATUSES.map((s) => ({ value: s, label: s }))}
                  />
                  <Button size="sm" variant="secondary" onClick={() => handleStatusChange(iv._id, statusEdits[iv._id] || iv.status)}>
                    Update Status
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="New Intervention" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <Field label="Problem Identified" htmlFor="problem" required>
              <TextArea id="problem" required value={form.problemIdentified} onChange={(e) => setForm({ ...form, problemIdentified: e.target.value })} />
            </Field>
            <Field label="Intervention Type" htmlFor="type">
              <Select id="type" value={form.interventionType} onChange={(e) => setForm({ ...form, interventionType: e.target.value })}
                options={TYPES.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Action Taken" htmlFor="action">
              <TextArea id="action" value={form.actionTaken} onChange={(e) => setForm({ ...form, actionTaken: e.target.value })} />
            </Field>
            <Field label="Follow-up Date" htmlFor="followUpDate">
              <Input id="followUpDate" type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
            </Field>
            <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Saving…' : 'Create Intervention'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
