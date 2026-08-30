import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Field, Input } from './FormField';
import { changePassword } from '../services/auth.service';
import { getErrorMessage } from '../services/api';
import { useToast } from './Toast';

export default function ChangePasswordModal({ onClose }) {
  const { push } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      push('Password changed successfully.');
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Change Password" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Current Password" htmlFor="currentPassword" required>
          <Input id="currentPassword" type="password" required autoComplete="current-password"
            value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        </Field>
        <Field label="New Password" htmlFor="newPassword" required hint="At least 8 characters.">
          <Input id="newPassword" type="password" required minLength={8} autoComplete="new-password"
            value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        </Field>
        <Field label="Confirm New Password" htmlFor="confirmPassword" required>
          <Input id="confirmPassword" type="password" required autoComplete="new-password"
            value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        </Field>
        {error && <p role="alert" style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: 'var(--space-3)' }}>{error}</p>}
        <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Saving…' : 'Change Password'}
        </Button>
      </form>
    </Modal>
  );
}
