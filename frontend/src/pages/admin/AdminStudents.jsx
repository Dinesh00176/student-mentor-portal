import { useState, useEffect } from 'react';
import StudentList from '../shared/StudentList';
import { createStudent } from '../../services/student.service';
import { listDepartments } from '../../services/department.service';
import { listMentors } from '../../services/mentor.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Field, Input, Select } from '../../components/FormField';

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
      listDepartments().then(({ data }) => setDepartments(data.data || []));
      listMentors().then(({ data }) => setMentors(data.data || []));
    }
  }, [showModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createStudent(form);
      push('Student enrolled successfully.');
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
        <Button onClick={() => setShowModal(true)}>
          + Enroll New Student
        </Button>
      </div>
      <StudentList key={refreshKey} basePath="/admin/students" />

      {showModal && (
        <Modal title="Enroll New Student" onClose={() => setShowModal(false)} size="md">
          <form onSubmit={handleSubmit}>
            <Field label="Full Name" htmlFor="name" required>
              <Input id="name" required placeholder="e.g. Aarav Patel" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Field label="Institutional Email" htmlFor="email" required>
                <Input id="email" type="email" required placeholder="aarav@student.college.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Temporary Password" htmlFor="password" required>
                <Input id="password" type="password" required placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Field label="Student USN / ID Code" htmlFor="studentCode" required>
                <Input id="studentCode" required placeholder="1MS21CS001" value={form.studentCode} onChange={(e) => setForm({ ...form, studentCode: e.target.value })} />
              </Field>
              <Field label="Academic Department" htmlFor="department" required>
                <Select
                  id="department"
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Select department..."
                  options={departments.map((d) => ({ value: d._id, label: d.name }))}
                />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
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
            <Field label="Assign Initial Mentor (Optional)" htmlFor="mentor">
              <Select
                id="mentor"
                value={form.assignedMentor}
                onChange={(e) => setForm({ ...form, assignedMentor: e.target.value })}
                placeholder="Unassigned (can assign later)"
                options={mentors.map((m) => ({ value: m.user?._id, label: `${m.user?.name} (${m.department?.name})` }))}
              />
            </Field>
            <Button type="submit" loading={submitting} fullWidth size="lg">
              Create Student Account
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
