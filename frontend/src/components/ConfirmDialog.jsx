import Modal from './Modal';
import Button from './Button';

// Reuses the existing Modal component rather than building a separate
// dialog implementation, per the "are you sure?" requirement for
// destructive actions.
export default function ConfirmDialog({ title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={(
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      )}
    >
      <p style={{ margin: 0, color: 'var(--color-ink-muted)' }}>{message}</p>
    </Modal>
  );
}
