import { useState } from 'react';
import StudentList from '../shared/StudentList';
import { createStudent } from '../../services/student.service';
import { listDepartments } from '../../services/department.service';
import { listMentors } from '../../services/mentor.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, Select } from '../../components/FormField';
import { useEffect } from 'react';

export default function AdminStudents() {
  const { push } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', studentCode: '', department: '', year: 1, semester: 1, section: 'A', assignedMentor: '',
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (showModal) {
      listDepartments().then(({ data }) => setDepartments(data.data));
      listMentors().then(({ data }) => setMentors(data.data));
    }
  }, [showModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createStudent(form);
      push('Student created.');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', studentCode: '', department: '', year: 1, semester: 1, section: 'A', assignedMentor: '' });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
        <Button onClick={() => setShowModal(true)}>+ Add Student</Button>
      </div>
      <StudentList key={refreshKey} basePath="/admin/students" />

      {showModal && (
        <Modal title="Add Student" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <Field label="Full Name" htmlFor="name" required>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email" htmlFor="email" required>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Temporary Password" htmlFor="password" required>
              <Input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Field label="Student ID" htmlFor="studentCode" required>
              <Input id="studentCode" required value={form.studentCode} onChange={(e) => setForm({ ...form, studentCode: e.target.value })} />
            </Field>
            <Field label="Department" htmlFor="department" required>
              <Select id="department" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Select department" options={departments.map((d) => ({ value: d._id, label: d.name }))} />
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
            <Field label="Assign Mentor" htmlFor="mentor">
              <Select id="mentor" value={form.assignedMentor} onChange={(e) => setForm({ ...form, assignedMentor: e.target.value })}
                placeholder="Unassigned" options={mentors.map((m) => ({ value: m.user?._id, label: m.user?.name }))} />
            </Field>
            <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Creating…' : 'Create Student'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
