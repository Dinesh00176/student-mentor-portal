import { useEffect, useState } from 'react';
import {
  getStudentAcademics,
  createAcademicRecord,
  updateAcademicRecord,
  deleteAcademicRecord,
} from '../../services/academic.service';
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
import { Field, Input, Select } from '../../components/FormField';

export default function AcademicTab({ studentId, canEdit = false, onDataChanged }) {
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
    credits: 3,
    internalMarks: '',
    examMarks: '',
    grade: '',
    gradePoint: '',
    isArrear: false,
    remarks: '',
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    getStudentAcademics(studentId)
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
      credits: 3,
      internalMarks: '',
      examMarks: '',
      grade: '',
      gradePoint: '',
      isArrear: false,
      remarks: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setForm({
      semester: record.semester,
      subject: record.subject,
      credits: record.credits || 3,
      internalMarks: record.internalMarks ?? '',
      examMarks: record.examMarks ?? '',
      grade: record.grade || '',
      gradePoint: record.gradePoint ?? '',
      isArrear: record.isArrear || false,
      remarks: record.remarks || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      push('Subject name or code is required.', 'error');
      return;
    }

    const payload = {
      student: studentId,
      semester: Number(form.semester),
      subject: form.subject.trim(),
      credits: Number(form.credits) || 3,
      internalMarks: form.internalMarks !== '' ? Number(form.internalMarks) : undefined,
      examMarks: form.examMarks !== '' ? Number(form.examMarks) : undefined,
      grade: form.grade ? form.grade.toUpperCase().trim() : undefined,
      gradePoint: form.gradePoint !== '' ? Number(form.gradePoint) : undefined,
      isArrear: Boolean(form.isArrear),
      remarks: form.remarks ? form.remarks.trim() : undefined,
    };

    setSubmitting(true);
    try {
      if (editingRecord) {
        await updateAcademicRecord(editingRecord._id, payload);
        push('Academic record updated.');
      } else {
        await createAcademicRecord(payload);
        push('Academic record added.');
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
      await deleteAcademicRecord(deleteTarget._id);
      push('Academic record deleted.');
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

  const currentArrears = data?.records?.filter((r) => r.isArrear).length || 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ margin: 0 }}>Academic Performance</h3>
        {canEdit && (
          <Button size="sm" variant="primary" onClick={handleOpenAdd}>
            + Add Academic Record
          </Button>
        )}
      </div>

      {(!data || data.records.length === 0) ? (
        <EmptyState
          title="No academic records yet"
          description={canEdit ? 'Click "+ Add Academic Record" to log semester coursework results.' : 'No academic data has been entered for this student.'}
        />
      ) : (
        <>
          <div className="profile-summary">
            <div className="profile-summary__item">
              <div className="profile-summary__label">Current Semester GPA</div>
              <div className="profile-summary__value tabular-nums">{data.currentSemesterGPA ?? '—'}</div>
            </div>
            <div className="profile-summary__item">
              <div className="profile-summary__label">Overall CGPA</div>
              <div className="profile-summary__value tabular-nums">{data.cgpa ?? '—'}</div>
            </div>
            <div className="profile-summary__item">
              <div className="profile-summary__label">Active Arrears</div>
              <div
                className="profile-summary__value tabular-nums"
                style={{ color: currentArrears > 0 ? 'var(--color-critical)' : 'var(--color-stable)' }}
              >
                {currentArrears}
              </div>
            </div>
          </div>

          {data.trend && data.trend.length > 1 && (
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Semester-by-Semester Progression</h3>
              <DataTable
                columns={[
                  { key: 'semester', header: 'Semester', render: (r) => `Semester ${r.semester}` },
                  { key: 'gpa', header: 'SGPA', render: (r) => <strong className="tabular-nums">{r.gpa}</strong> },
                  {
                    key: 'arrears',
                    header: 'Arrears',
                    render: (r) => (
                      <span className="tabular-nums" style={{ color: r.arrears > 0 ? 'var(--color-critical)' : 'var(--color-ink-muted)' }}>
                        {r.arrears}
                      </span>
                    ),
                  },
                  { key: 'subjectCount', header: 'Enrolled Subjects', render: (r) => <span className="tabular-nums">{r.subjectCount}</span> },
                ]}
                rows={data.trend.map((t) => ({ ...t, _id: t.semester }))}
              />
            </div>
          )}

          <h3 style={{ marginBottom: 'var(--space-3)' }}>Subject Performance — Semester {data.records[0]?.semester}</h3>
          <DataTable
            columns={[
              { key: 'subject', header: 'Subject Code / Title' },
              { key: 'credits', header: 'Credits', render: (r) => <span className="tabular-nums">{r.credits ?? '—'}</span> },
              { key: 'internalMarks', header: 'Internal', render: (r) => <span className="tabular-nums">{r.internalMarks ?? '—'}</span> },
              { key: 'examMarks', header: 'End Sem Exam', render: (r) => <span className="tabular-nums">{r.examMarks ?? '—'}</span> },
              { key: 'grade', header: 'Grade', render: (r) => <strong>{r.grade || '—'}</strong> },
              { key: 'gradePoint', header: 'Grade Point', render: (r) => <span className="tabular-nums">{r.gradePoint ?? '—'}</span> },
              {
                key: 'isArrear',
                header: 'Result',
                render: (r) => (r.isArrear ? <Badge status="Critical">Arrear</Badge> : <Badge status="Stable">Passed</Badge>),
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

      {/* Add / Edit Academic Modal */}
      {showModal && (
        <Modal
          title={editingRecord ? 'Edit Academic Record' : 'Add Course Academic Record'}
          onClose={() => setShowModal(false)}
          size="md"
        >
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 'var(--space-3)' }}>
              <Field label="Semester" htmlFor="acad-sem" required>
                <Input
                  id="acad-sem"
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                />
              </Field>
              <Field label="Subject Code & Title" htmlFor="acad-sub" required>
                <Input
                  id="acad-sub"
                  required
                  placeholder="e.g. CS501 Database Management Systems"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </Field>
              <Field label="Credits" htmlFor="acad-credits" required>
                <Input
                  id="acad-credits"
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={form.credits}
                  onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <Field label="Internal (0–100)" htmlFor="acad-internal">
                <Input
                  id="acad-internal"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 42"
                  value={form.internalMarks}
                  onChange={(e) => setForm({ ...form, internalMarks: e.target.value })}
                />
              </Field>
              <Field label="End Sem Exam (0–100)" htmlFor="acad-exam">
                <Input
                  id="acad-exam"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 78"
                  value={form.examMarks}
                  onChange={(e) => setForm({ ...form, examMarks: e.target.value })}
                />
              </Field>
              <Field label="Grade" htmlFor="acad-grade">
                <Input
                  id="acad-grade"
                  placeholder="e.g. A+"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                />
              </Field>
              <Field label="Grade Point (0–10)" htmlFor="acad-gp">
                <Input
                  id="acad-gp"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="e.g. 8.5"
                  value={form.gradePoint}
                  onChange={(e) => setForm({ ...form, gradePoint: e.target.value })}
                />
              </Field>
            </div>

            <div style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input
                id="acad-arrear"
                type="checkbox"
                checked={form.isArrear}
                onChange={(e) => setForm({ ...form, isArrear: e.target.checked })}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="acad-arrear" style={{ fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer' }}>
                Flag this subject as an active arrear / backlog
              </label>
            </div>

            <Field label="Remarks / Faculty Notes" htmlFor="acad-remarks">
              <Input
                id="acad-remarks"
                placeholder="Optional notes regarding course performance..."
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </Field>

            <Button type="submit" variant="primary" fullWidth loading={submitting} disabled={submitting}>
              {editingRecord ? 'Save Changes' : 'Record Course Result'}
            </Button>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Academic Record"
          message={`Are you sure you want to remove the record for "${deleteTarget.subject}" (Semester ${deleteTarget.semester})? This will trigger recalculation of GPA and CGPA.`}
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
