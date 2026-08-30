import { useEffect, useState } from 'react';
import { listDepartments } from '../../services/department.service';
import { updateStudent } from '../../services/student.service';
import { getErrorMessage } from '../../services/api';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { Field, Input, Select } from '../../components/FormField';
import { useToast } from '../../components/Toast';

const ENROLLMENT_OPTIONS = ['active', 'inactive', 'graduated'];

export default function EditStudentModal({ student, onClose, onSaved }) {
  const { push } = useToast();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    name: student.user?.name || '',
    department: student.department?._id || '',
    year: student.year,
    semester: student.semester,
    section: student.section,
    enrollmentStatus: student.enrollmentStatus,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { listDepartments().then(({ data }) => setDepartments(data.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateStudent(student._id, form);
      push('Student details updated.');
      onSaved();
      onClose();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Edit Student Details" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Full Name" htmlFor="name" required>
          <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Department" htmlFor="department" required>
          <Select id="department" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
            options={departments.map((d) => ({ value: d._id, label: d.name }))} />
        </Field>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Field label="Year" htmlFor="year">
            <Input id="year" type="number" min="1" max="6" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          </Field>
          <Field label="Semester" htmlFor="semester">
            <Input id="semester" type="number" min="1" max="12" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
          </Field>
          <Field label="Section" htmlFor="section">
            <Input id="section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
          </Field>
        </div>
        <Field label="Enrollment Status" htmlFor="enrollmentStatus">
          <Select id="enrollmentStatus" value={form.enrollmentStatus} onChange={(e) => setForm({ ...form, enrollmentStatus: e.target.value })}
            options={ENROLLMENT_OPTIONS.map((s) => ({ value: s, label: s }))} />
        </Field>
        <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Saving…' : 'Save Changes'}
        </Button>
      </form>
    </Modal>
  );
}
