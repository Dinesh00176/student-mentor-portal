import { useEffect, useState } from 'react';
import { listDepartments, createDepartment } from '../../services/department.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input } from '../../components/FormField';

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
      .then(({ data }) => setDepartments(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createDepartment(form);
      push('Department created.');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h1>Departments</h1>
        <Button onClick={() => setShowModal(true)}>+ Add Department</Button>
      </div>

      {loading && <Skeleton rows={3} height={40} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && departments && departments.length === 0 && <EmptyState title="No departments added yet." />}
      {!loading && !error && departments && departments.length > 0 && (
        <DataTable
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'code', header: 'Code' },
            { key: 'description', header: 'Description' },
          ]}
          rows={departments}
        />
      )}

      {showModal && (
        <Modal title="Add Department" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <Field label="Name" htmlFor="name" required>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Code" htmlFor="code" required hint="e.g. CSE">
              <Input id="code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </Field>
            <Field label="Description" htmlFor="description">
              <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Creating…' : 'Create Department'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
