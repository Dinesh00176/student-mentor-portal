import { useEffect, useState } from 'react';
import {
  getAttendanceConcerns, getAcademicConcerns, getCounselingActivity, getInterventionStatus,
  getMentorWorkload, getStudentsNeedingAttention, downloadReportCsv,
} from '../../services/report.service';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../components/Toast';
import Tabs from '../../components/Tabs';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import DataTable from '../../components/DataTable';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

function ReportPanel({ path, fetcher, columns, emptyTitle, statusBreakdown, filename }) {
  const { push } = useToast();
  const [rows, setRows] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetcher()
      .then(({ data }) => {
        if (statusBreakdown) {
          setRows((statusBreakdown === 'sessions' ? data.data.sessions : data.data.interventions).map((r, i) => ({ ...r, _id: r._id || i })));
          setBreakdown(data.data.byStatus);
        } else {
          setRows(data.data.map((r, i) => ({ ...r, _id: r._id || i })));
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadReportCsv(path, {}, filename);
      push(`Exported ${filename} successfully.`);
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Skeleton rows={4} height={40} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
        <Button size="sm" variant="secondary" loading={exporting} onClick={handleExport}>
          📥 Export to CSV
        </Button>
      </div>

      {(!rows || rows.length === 0) ? (
        <EmptyState title={emptyTitle} />
      ) : (
        <>
          {breakdown && (
            <div className="grid-cards" style={{ marginBottom: 'var(--space-4)' }}>
              {Object.entries(breakdown).map(([k, v]) => (
                <StatCard key={k} label={k} value={v} tone={k.toLowerCase().includes('critical') ? 'critical' : k.toLowerCase().includes('attention') ? 'attention' : 'accent'} />
              ))}
            </div>
          )}
          <DataTable columns={columns} rows={rows} />
        </>
      )}
    </div>
  );
}

export default function AdminReports() {
  const tabs = [
    {
      id: 'attention',
      label: 'Students Needing Attention',
      content: (
        <ReportPanel
          path="/reports/students-needing-attention" filename="students-needing-attention.csv"
          fetcher={getStudentsNeedingAttention}
          emptyTitle="No students currently need attention."
          columns={[
            { key: 'student', header: 'Student ID', render: (r) => <strong style={{ color: 'var(--color-accent-strong)' }}>{r.student}</strong> },
            { key: 'department', header: 'Department' },
            { key: 'status', header: 'Risk Status', render: (r) => <Badge status={r.status} size="sm" /> },
            {
              key: 'reasons',
              header: 'Trigger Signals',
              render: (r) => (
                <ul className="reason-list" style={{ margin: 0, paddingLeft: 14 }}>
                  {Array.isArray(r.reasons) ? r.reasons.map((rsn, idx) => <li key={idx}>{rsn}</li>) : <li>{r.reasons}</li>}
                </ul>
              ),
            },
          ]}
        />
      ),
    },
    {
      id: 'attendance',
      label: 'Attendance Concerns',
      content: (
        <ReportPanel
          path="/reports/attendance-concerns" filename="attendance-concerns.csv"
          fetcher={getAttendanceConcerns}
          emptyTitle="No attendance concerns flagged at this time."
          columns={[
            { key: 'student', header: 'Student ID', render: (r) => <strong style={{ color: 'var(--color-accent-strong)' }}>{r.student}</strong> },
            { key: 'department', header: 'Department' },
            { key: 'percentage', header: 'Attendance %', render: (r) => <strong className="tabular-nums">{r.percentage}%</strong> },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} size="sm" /> },
          ]}
        />
      ),
    },
    {
      id: 'academic',
      label: 'Academic Concerns',
      content: (
        <ReportPanel
          path="/reports/academic-concerns" filename="academic-concerns.csv"
          fetcher={getAcademicConcerns}
          emptyTitle="No academic concerns flagged at this time."
          columns={[
            { key: 'student', header: 'Student ID', render: (r) => <strong style={{ color: 'var(--color-accent-strong)' }}>{r.student}</strong> },
            { key: 'department', header: 'Department' },
            { key: 'gpa', header: 'Semester GPA', render: (r) => <strong className="tabular-nums">{r.gpa}</strong> },
            { key: 'arrears', header: 'Arrear Count', render: (r) => <span className="tabular-nums" style={{ color: r.arrears > 0 ? 'var(--color-critical)' : 'inherit', fontWeight: 600 }}>{r.arrears}</span> },
          ]}
        />
      ),
    },
    {
      id: 'counseling',
      label: 'Counseling Activity',
      content: (
        <ReportPanel
          path="/reports/counseling-activity" filename="counseling-activity.csv"
          fetcher={getCounselingActivity}
          emptyTitle="No counseling sessions recorded."
          statusBreakdown="sessions"
          columns={[
            { key: 'student', header: 'Student', render: (r) => r.student?.studentCode || '—' },
            { key: 'conductedBy', header: 'Conducted By', render: (r) => r.conductedBy?.name || 'Counselor' },
            { key: 'sessionType', header: 'Type', render: (r) => <strong>{r.sessionType}</strong> },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} size="sm" /> },
          ]}
        />
      ),
    },
    {
      id: 'interventions',
      label: 'Intervention Status',
      content: (
        <ReportPanel
          path="/reports/intervention-status" filename="intervention-status.csv"
          fetcher={getInterventionStatus}
          emptyTitle="No interventions recorded."
          statusBreakdown="interventions"
          columns={[
            { key: 'student', header: 'Student', render: (r) => r.student?.studentCode || '—' },
            { key: 'assignedTo', header: 'Assigned Faculty', render: (r) => r.assignedTo?.name || 'Mentor' },
            { key: 'interventionType', header: 'Type', render: (r) => <strong>{r.interventionType}</strong> },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} size="sm" /> },
          ]}
        />
      ),
    },
    {
      id: 'workload',
      label: 'Mentor Workload',
      content: (
        <ReportPanel
          path="/reports/mentor-workload" filename="mentor-workload.csv"
          fetcher={getMentorWorkload}
          emptyTitle="No mentor workload data."
          columns={[
            { key: 'mentor', header: 'Faculty Mentor', render: (r) => <strong>{r.mentor}</strong> },
            { key: 'email', header: 'Institutional Email', render: (r) => r.email },
            { key: 'currentLoad', header: 'Assigned Mentees', render: (r) => <span className="tabular-nums" style={{ fontWeight: 600 }}>{r.currentLoad}</span> },
            { key: 'maxLoad', header: 'Capacity Limit', render: (r) => <span className="tabular-nums">{r.maxLoad}</span> },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Institutional Analytics &amp; Reports</h1>
          <p className="page-header__subtitle">Generate, filter, and export compliance, attention, counseling, and cohort workload reports.</p>
        </div>
      </div>
      <Tabs tabs={tabs} />
    </div>
  );
}
