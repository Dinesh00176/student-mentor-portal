import { useEffect, useState } from 'react';
import { listCounselors, createCounselor, updateCounselor, updateCounselorStatus } from '../../services/counselor.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Field, Input, Select } from '../../components/FormField';

const STATUS_OPTIONS = ['active', 'inactive', 'suspended'];

export default function AdminCounselors() {
  const { push } = useToast();
  const [counselors, setCounselors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', specialization: 'General Counseling', maxCaseLoad: 30 });

  const load = () => {
    setLoading(true);
    listCounselors({ q: debouncedQuery, status: statusFilter })
      .then(({ data }) => setCounselors(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [debouncedQuery, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', specialization: 'General Counseling', maxCaseLoad: 30 });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.user?.name || '', email: c.user?.email || '', password: '', specialization: c.specialization, maxCaseLoad: c.maxCaseLoad });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await updateCounselor(editing._id, { name: form.name, specialization: form.specialization, maxCaseLoad: form.maxCaseLoad });
        push('Counselor updated.');
      } else {
        await createCounselor(form);
        push('Counselor created.');
      }
      setShowModal(false);
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (counselor, status) => {
    try {
      await updateCounselorStatus(counselor._id, status);
      push(`Counselor marked ${status}.`);
      setConfirmTarget(null);
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h1>Counselors</h1>
        <Button onClick={openCreate}>+ Add Counselor</Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <div style={{ minWidth: 220, flex: 1 }}>
          <Field htmlFor="q" label="Search">
            <Input id="q" placeholder="Name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
          </Field>
        </div>
        <div style={{ minWidth: 160 }}>
          <Field htmlFor="status" label="Status">
            <Select id="status" placeholder="All statuses" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
          </Field>
        </div>
      </div>

      {loading && <Skeleton rows={4} height={40} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && counselors && counselors.length === 0 && <EmptyState title="No counselors found." />}
      {!loading && !error && counselors && counselors.length > 0 && (
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (r) => r.user?.name },
            { key: 'email', header: 'Email', render: (r) => r.user?.email },
            { key: 'specialization', header: 'Specialization' },
            { key: 'maxCaseLoad', header: 'Max Case Load' },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.user?.status === 'active' ? 'Stable' : r.user?.status}>{r.user?.status}</Badge> },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Button>
                  {r.user?.status === 'active' ? (
                    <Button size="sm" variant="danger" onClick={() => setConfirmTarget({ counselor: r, status: 'inactive' })}>Deactivate</Button>
                  ) : (
                    <Button size="sm" onClick={() => handleStatusChange(r, 'active')}>Reactivate</Button>
                  )}
                </div>
              ),
            },
          ]}
          rows={counselors}
        />
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Counselor' : 'Add Counselor'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <Field label="Full Name" htmlFor="name" required>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email" htmlFor="email" required>
              <Input id="email" type="email" required disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            {!editing && (
              <Field label="Temporary Password" htmlFor="password" required>
                <Input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
            )}
            <Field label="Specialization" htmlFor="specialization">
              <Input id="specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            </Field>
            <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Counselor'}
            </Button>
          </form>
        </Modal>
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Deactivate counselor?"
          message={`${confirmTarget.counselor.user?.name} will no longer be able to log in. Their case history remains intact and you can reactivate them anytime.`}
          confirmLabel="Deactivate"
          onCancel={() => setConfirmTarget(null)}
          onConfirm={() => handleStatusChange(confirmTarget.counselor, confirmTarget.status)}
        />
      )}
    </div>
  );
}
