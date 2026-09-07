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
    <Modal title="Change Password" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <Field label="Current Password" htmlFor="currentPassword" required>
          <Input
            id="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          />
        </Field>
        <Field label="New Password" htmlFor="newPassword" required hint="Must be at least 8 characters long.">
          <Input
            id="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          />
        </Field>
        <Field label="Confirm New Password" htmlFor="confirmPassword" required>
          <Input
            id="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
        </Field>

        {error && (
          <div role="alert" style={{ color: 'var(--color-critical)', fontSize: '0.84rem', marginBottom: 'var(--space-4)', padding: '8px 12px', background: 'var(--color-critical-tint)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-critical-border)' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 'var(--space-4)' }}>
          <Button type="submit" loading={submitting} fullWidth>
            Save New Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
