import { useEffect, useState } from 'react';
import { listMentors, createMentor, updateMentor, updateMentorStatus } from '../../services/mentor.service';
import { listDepartments } from '../../services/department.service';
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

export default function AdminMentors() {
  const { push } = useToast();
  const [mentors, setMentors] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', designation: 'Faculty Mentor', maxStudentLoad: 20 });

  const load = () => {
    setLoading(true);
    listMentors({ q: debouncedQuery, status: statusFilter })
      .then(({ data }) => setMentors(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [debouncedQuery, statusFilter]);
  useEffect(() => { listDepartments().then(({ data }) => setDepartments(data.data)); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', department: '', designation: 'Faculty Mentor', maxStudentLoad: 20 });
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({ name: m.user?.name || '', email: m.user?.email || '', password: '', department: m.department?._id || '', designation: m.designation, maxStudentLoad: m.maxStudentLoad });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await updateMentor(editing._id, { name: form.name, department: form.department, designation: form.designation, maxStudentLoad: form.maxStudentLoad });
        push('Mentor updated.');
      } else {
        await createMentor(form);
        push('Mentor created.');
      }
      setShowModal(false);
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (mentor, status) => {
    try {
      await updateMentorStatus(mentor._id, status);
      push(`Mentor marked ${status}.`);
      setConfirmTarget(null);
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h1>Mentors</h1>
        <Button onClick={openCreate}>+ Add Mentor</Button>
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
      {!loading && !error && mentors && mentors.length === 0 && <EmptyState title="No mentors found." />}
      {!loading && !error && mentors && mentors.length > 0 && (
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (r) => r.user?.name },
            { key: 'email', header: 'Email', render: (r) => r.user?.email },
            { key: 'department', header: 'Department', render: (r) => r.department?.name },
            { key: 'load', header: 'Workload', render: (r) => `${r.currentStudentLoad} / ${r.maxStudentLoad}` },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.user?.status === 'active' ? 'Stable' : r.user?.status}>{r.user?.status}</Badge> },
            {
              key: 'actions',
              header: '',
              render: (r) => (
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Button>
                  {r.user?.status === 'active' ? (
                    <Button size="sm" variant="danger" onClick={() => setConfirmTarget({ mentor: r, status: 'inactive' })}>Deactivate</Button>
                  ) : (
                    <Button size="sm" onClick={() => handleStatusChange(r, 'active')}>Reactivate</Button>
                  )}
                </div>
              ),
            },
          ]}
          rows={mentors}
        />
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Mentor' : 'Add Mentor'} onClose={() => setShowModal(false)}>
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
            <Field label="Department" htmlFor="department" required>
              <Select id="department" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Select department" options={departments.map((d) => ({ value: d._id, label: d.name }))} />
            </Field>
            <Field label="Max Student Load" htmlFor="maxStudentLoad">
              <Input id="maxStudentLoad" type="number" min="1" value={form.maxStudentLoad} onChange={(e) => setForm({ ...form, maxStudentLoad: Number(e.target.value) })} />
            </Field>
            <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Mentor'}
            </Button>
          </form>
        </Modal>
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Deactivate mentor?"
          message={`${confirmTarget.mentor.user?.name} will no longer be able to log in, but their history and assigned students remain intact. You can reactivate them anytime.`}
          confirmLabel="Deactivate"
          onCancel={() => setConfirmTarget(null)}
          onConfirm={() => handleStatusChange(confirmTarget.mentor, confirmTarget.status)}
        />
      )}
    </div>
  );
}
