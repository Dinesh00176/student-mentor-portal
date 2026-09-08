import { useEffect, useState } from 'react';
import {
  getStudentAttendance,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
} from '../../services/attendance.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Field, Input } from '../../components/FormField';

export default function AttendanceTab({ studentId, canEdit = false, onDataChanged }) {
  const { push } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    semester: 1,
    subject: '',
    totalClasses: 40,
    attendedClasses: 35,
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    getStudentAttendance(studentId)
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [studentId]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setForm({
      semester: data?.records?.[0]?.semester || 1,
      subject: '',
      totalClasses: 40,
      attendedClasses: 35,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setForm({
      semester: record.semester,
      subject: record.subject,
      totalClasses: record.totalClasses,
      attendedClasses: record.attendedClasses,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = Number(form.totalClasses);
    const attended = Number(form.attendedClasses);

    if (total < 0 || attended < 0) {
      push('Total and attended sessions must be non-negative.', 'error');
      return;
    }
    if (attended > total) {
      push('Attended sessions cannot exceed total sessions scheduled.', 'error');
      return;
    }
    if (!form.subject.trim()) {
      push('Subject name or code is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingRecord) {
        await updateAttendanceRecord(editingRecord._id, {
          semester: Number(form.semester),
          subject: form.subject.trim(),
          totalClasses: total,
          attendedClasses: attended,
        });
        push('Attendance record updated.');
      } else {
        await createAttendanceRecord({
          student: studentId,
          semester: Number(form.semester),
          subject: form.subject.trim(),
          totalClasses: total,
          attendedClasses: attended,
        });
        push('Attendance record created.');
      }
      setShowModal(false);
      load();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAttendanceRecord(deleteTarget._id);
      push('Attendance record deleted.');
      setDeleteTarget(null);
      load();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Skeleton rows={4} height={36} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const pct = data?.summary?.percentage || 0;
  const pctColor = pct >= 80 ? 'var(--color-stable)' : pct >= 75 ? 'var(--color-attention)' : 'var(--color-critical)';

  // Calculate live preview metrics for the form modal
  const formTotal = Number(form.totalClasses) || 0;
  const formAttended = Number(form.attendedClasses) || 0;
  const formPct = formTotal > 0 ? Math.round((formAttended / formTotal) * 10000) / 100 : 0;
  const formClassification = formPct >= 80 ? 'Healthy' : formPct >= 75 ? 'Attention Required' : 'Critical';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ margin: 0 }}>Attendance Tracking</h3>
        {canEdit && (
          <Button size="sm" variant="primary" onClick={handleOpenAdd}>
            + Add Attendance
          </Button>
        )}
      </div>

      {(!data || data.records.length === 0) ? (
        <EmptyState
          title="No attendance records yet"
          description={canEdit ? 'Click "+ Add Attendance" to record subject sessions for this student.' : 'No attendance data has been entered for this student.'}
        />
      ) : (
        <>
          <div className="profile-summary">
            <div className="profile-summary__item">
              <div className="profile-summary__label">Overall Attendance</div>
              <div className="profile-summary__value tabular-nums" style={{ color: pctColor }}>
                {pct}%
              </div>
            </div>
            <div className="profile-summary__item">
              <div className="profile-summary__label">Institutional Status</div>
              <div style={{ marginTop: 4 }}>
                <Badge status={data.summary.status} />
              </div>
            </div>
            <div className="profile-summary__item">
              <div className="profile-summary__label">Classes Attended</div>
              <div className="profile-summary__value tabular-nums">
                {data.summary.attendedClasses}{' '}
                <span style={{ fontSize: '0.9rem', color: 'var(--color-ink-faint)', fontWeight: 500 }}>
                  / {data.summary.totalClasses}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Attendance Safety Meter */}
          <div className="record-card" style={{ marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Attendance Safety Threshold</span>
              <span className="tabular-nums" style={{ fontSize: '0.84rem', fontWeight: 700, color: pctColor }}>
                {pct}% (Min 75% required)
              </span>
            </div>
            <div style={{ background: 'var(--color-surface-sunken)', height: 10, borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: pctColor,
                  height: '100%',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.4s var(--ease-spring)',
                }}
              />
            </div>
          </div>

          <h3 style={{ marginBottom: 'var(--space-3)' }}>Subject-wise Attendance Breakdown</h3>
          <DataTable
            columns={[
              { key: 'subject', header: 'Subject' },
              { key: 'totalClasses', header: 'Total Sessions', render: (r) => <span className="tabular-nums">{r.totalClasses}</span> },
              { key: 'attendedClasses', header: 'Attended', render: (r) => <span className="tabular-nums">{r.attendedClasses}</span> },
              {
                key: 'percentage',
                header: 'Attendance %',
                render: (r) => <strong className="tabular-nums">{r.percentage}%</strong>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => {
                  const status = r.percentage >= 80 ? 'Healthy' : r.percentage >= 75 ? 'Attention Required' : 'Critical';
                  return <Badge status={status} />;
                },
              },
              ...(canEdit
                ? [
                    {
                      key: 'actions',
                      header: 'Actions',
                      render: (r) => (
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(r)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(r)} style={{ color: 'var(--color-critical)' }}>
                            Delete
                          </Button>
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
            rows={data.records}
          />
        </>
      )}

      {/* Add / Edit Attendance Modal */}
      {showModal && (
        <Modal
          title={editingRecord ? 'Edit Attendance Record' : 'Record Subject Attendance'}
          onClose={() => setShowModal(false)}
          size="sm"
        >
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-3)' }}>
              <Field label="Semester" htmlFor="att-sem" required>
                <Input
                  id="att-sem"
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                />
              </Field>
              <Field label="Subject Name / Code" htmlFor="att-sub" required>
                <Input
                  id="att-sub"
                  required
                  placeholder="e.g. Operating Systems (CS501)"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Field label="Total Sessions" htmlFor="att-total" required>
                <Input
                  id="att-total"
                  type="number"
                  min="0"
                  required
                  value={form.totalClasses}
                  onChange={(e) => setForm({ ...form, totalClasses: e.target.value })}
                />
              </Field>
              <Field label="Attended Sessions" htmlFor="att-attended" required>
                <Input
                  id="att-attended"
                  type="number"
                  min="0"
                  required
                  value={form.attendedClasses}
                  onChange={(e) => setForm({ ...form, attendedClasses: e.target.value })}
                />
              </Field>
            </div>

            {/* Real-time Calculation Preview Card */}
            <div
              style={{
                marginTop: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
                padding: 'var(--space-3)',
                background: 'var(--color-surface-sunken)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', display: 'block' }}>Calculated Percentage</span>
                <strong className="tabular-nums" style={{ fontSize: '1.2rem', color: formAttended > formTotal ? 'var(--color-critical)' : 'inherit' }}>
                  {formTotal > 0 ? `${formPct}%` : '0%'}
                </strong>
                {formAttended > formTotal && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-critical)', display: 'block' }}>
                    Attended cannot exceed total.
                  </span>
                )}
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', display: 'block', marginBottom: 2 }}>Classification</span>
                <Badge status={formClassification} size="sm" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={submitting}
              disabled={submitting || formAttended > formTotal}
            >
              {editingRecord ? 'Save Changes' : 'Create Attendance Record'}
            </Button>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Attendance Record"
          message={`Are you sure you want to delete the attendance record for "${deleteTarget.subject}" (Semester ${deleteTarget.semester})? This will affect the student's aggregate attendance.`}
          confirmLabel="Delete Record"
          tone="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
