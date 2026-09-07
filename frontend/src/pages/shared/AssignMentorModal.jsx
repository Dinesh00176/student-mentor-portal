import { useEffect, useState } from 'react';
import { listMentors } from '../../services/mentor.service';
import { assignMentor } from '../../services/student.service';
import { getErrorMessage } from '../../services/api';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { Field, Select } from '../../components/FormField';
import { useToast } from '../../components/Toast';

export default function AssignMentorModal({ studentId, currentMentorId, onClose, onAssigned }) {
  const { push } = useToast();
  const [mentors, setMentors] = useState([]);
  const [selected, setSelected] = useState(currentMentorId || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listMentors({ status: 'active' }).then(({ data }) => setMentors(data.data || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await assignMentor(studentId, selected);
      push('Mentor assigned successfully.');
      onAssigned();
      onClose();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Assign Faculty Mentor" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <Field label="Select Faculty Mentor" htmlFor="mentor" required hint="Shows active mentors with their current student load capacity.">
          <Select
            id="mentor"
            required
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            placeholder="Select a mentor..."
            options={mentors.map((m) => ({
              value: m.user?._id,
              label: `${m.user?.name} — ${m.department?.name} (Load: ${m.currentStudentLoad}/${m.maxStudentLoad})`,
            }))}
          />
        </Field>
        <Button type="submit" loading={submitting} disabled={!selected} fullWidth size="lg">
          Confirm Assignment
        </Button>
      </form>
    </Modal>
  );
}
