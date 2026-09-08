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
  const [overrideCapacity, setOverrideCapacity] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listMentors({ status: 'active' }).then(({ data }) => setMentors(data.data || []));
  }, []);

  const selectedMentor = mentors.find((m) => String(m.user?._id) === String(selected));
  const isAtCapacity = selectedMentor && selectedMentor.currentStudentLoad >= selectedMentor.maxStudentLoad;

  const handleSelectMentor = (val) => {
    setSelected(val);
    setOverrideCapacity(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAtCapacity && !overrideCapacity) {
      push('Please confirm capacity override to assign to a full mentor.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await assignMentor(studentId, selected, overrideCapacity);
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
            onChange={(e) => handleSelectMentor(e.target.value)}
            placeholder="Select a mentor..."
            options={mentors.map((m) => {
              const isFull = m.currentStudentLoad >= m.maxStudentLoad;
              const avail = m.maxStudentLoad - m.currentStudentLoad;
              return {
                value: m.user?._id,
                label: `${m.user?.name} — ${m.department?.name || ''} (${m.currentStudentLoad} / ${m.maxStudentLoad} mentees${isFull ? ' — FULL' : `, ${avail} free`})`,
              };
            })}
          />
        </Field>

        {isAtCapacity && (
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--color-critical-tint)',
              border: '1px solid var(--color-critical)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <div style={{ color: 'var(--color-critical)', fontWeight: 600, fontSize: '0.88rem' }}>
              ⚠️ Capacity Limit Reached
            </div>
            <p style={{ margin: '4px 0 8px', fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>
              {selectedMentor?.user?.name} has reached maximum mentee capacity ({selectedMentor?.currentStudentLoad} / {selectedMentor?.maxStudentLoad}). Assigning an additional student requires administrative override.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={overrideCapacity}
                onChange={(e) => setOverrideCapacity(e.target.checked)}
              />
              Enable capacity override for this assignment
            </label>
          </div>
        )}

        <Button
          type="submit"
          loading={submitting}
          disabled={!selected || (isAtCapacity && !overrideCapacity)}
          fullWidth
          size="lg"
        >
          Confirm Assignment
        </Button>
      </form>
    </Modal>
  );
}
