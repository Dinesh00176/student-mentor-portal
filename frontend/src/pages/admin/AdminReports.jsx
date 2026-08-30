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
import Button from '../../components/Button';

function ReportPanel({ path, fetcher, columns, emptyTitle, statusBreakdown, filename }) {
  const { push } = useToast();
  const [rows, setRows] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async () => {
    try {
      await downloadReportCsv(path, {}, filename);
    } catch (err) {
      push(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <Skeleton rows={4} height={40} />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
        <Button size="sm" variant="secondary" onClick={handleExport}>Export CSV</Button>
      </div>
      {(!rows || rows.length === 0) ? <EmptyState title={emptyTitle} /> : (
        <>
          {breakdown && (
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
              {Object.entries(breakdown).map(([k, v]) => <StatCard key={k} label={k} value={v} />)}
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
            { key: 'student', header: 'Student ID' },
            { key: 'department', header: 'Department' },
            { key: 'status', header: 'Status' },
            { key: 'reasons', header: 'Reasons' },
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
          emptyTitle="No attendance concerns right now."
          columns={[
            { key: 'student', header: 'Student ID' },
            { key: 'department', header: 'Department' },
            { key: 'percentage', header: '%', render: (r) => `${r.percentage}%` },
            { key: 'status', header: 'Status' },
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
          emptyTitle="No academic concerns right now."
          columns={[
            { key: 'student', header: 'Student ID' },
            { key: 'department', header: 'Department' },
            { key: 'gpa', header: 'GPA' },
            { key: 'arrears', header: 'Arrears' },
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
            { key: 'student', header: 'Student', render: (r) => r.student?.studentCode },
            { key: 'conductedBy', header: 'Conducted By', render: (r) => r.conductedBy?.name },
            { key: 'sessionType', header: 'Type' },
            { key: 'status', header: 'Status' },
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
            { key: 'student', header: 'Student', render: (r) => r.student?.studentCode },
            { key: 'assignedTo', header: 'Assigned To', render: (r) => r.assignedTo?.name },
            { key: 'interventionType', header: 'Type' },
            { key: 'status', header: 'Status' },
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
            { key: 'mentor', header: 'Mentor' },
            { key: 'email', header: 'Email' },
            { key: 'currentLoad', header: 'Current Load' },
            { key: 'maxLoad', header: 'Capacity' },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <h1>Reports</h1>
      <Tabs tabs={tabs} />
    </div>
  );
}
