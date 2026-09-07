import { useEffect, useState } from 'react';
import { listDepartments, createDepartment } from '../../services/department.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, TextArea } from '../../components/FormField';

export default function AdminDepartments() {
  const { push } = useToast();
  const [departments, setDepartments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  const load = () => {
    setLoading(true);
    listDepartments()
      .then(({ data }) => setDepartments(data.data || []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createDepartment(form);
      push('Department created successfully.');
      setShowModal(false);
      setForm({ name: '', code: '', description: '' });
      load();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Academic Departments</h1>
          <p className="page-header__subtitle">Manage academic faculties, codes, and curricular organizational units.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Add Department</Button>
      </div>

      {loading && <Skeleton rows={3} height={40} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && departments && departments.length === 0 && <EmptyState title="No departments added yet." />}
      {!loading && !error && departments && departments.length > 0 && (
        <DataTable
          columns={[
            { key: 'name', header: 'Department Name', render: (r) => <strong>{r.name}</strong> },
            { key: 'code', header: 'Department Code', render: (r) => <Badge status="info" size="sm">{r.code}</Badge> },
            { key: 'description', header: 'Description', render: (r) => r.description || '—' },
          ]}
          rows={departments}
        />
      )}

      {showModal && (
        <Modal title="Add Academic Department" onClose={() => setShowModal(false)} size="sm">
          <form onSubmit={handleSubmit}>
            <Field label="Department Name" htmlFor="name" required>
              <Input id="name" required placeholder="e.g. Computer Science and Engineering" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Department Code" htmlFor="code" required hint="Unique uppercase acronym (e.g. CSE, ECE, MECH)">
              <Input id="code" required placeholder="CSE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Description (Optional)" htmlFor="description">
              <TextArea id="description" placeholder="Brief outline of the department focus..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Button type="submit" loading={submitting} fullWidth size="lg">
              Create Department
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
