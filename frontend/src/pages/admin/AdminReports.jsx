import { useEffect, useState } from 'react';
import {
  getAttendanceConcerns, getAcademicConcerns, getCounselingActivity, getInterventionStatus,
  getMentorWorkload, getStudentsNeedingAttention, downloadReportCsv,
} from '../../services/report.service';
import { listDepartments } from '../../services/department.service';
import { listMentors } from '../../services/mentor.service';
import { listCounselors } from '../../services/counselor.service';
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

function ReportPanel({
  path,
  fetcher,
  columns,
  emptyTitle,
  statusBreakdown,
  filename,
  filterFields = [],
  departments = [],
  mentors = [],
  counselors = [],
}) {
  const { push } = useToast();
  const [rows, setRows] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    semester: '',
    mentor: '',
    counselor: '',
    status: '',
    priority: '',
    interventionType: '',
    assignedTo: '',
    from: '',
    to: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  const load = (query = appliedFilters) => {
    setLoading(true);
    setError('');
    // Remove empty keys from query
    const cleanParams = {};
    Object.entries(query).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined && v !== 'all') {
        cleanParams[k] = v;
      }
    });

    fetcher(cleanParams)
      .then(({ data }) => {
        const payload = data?.data;
        if (!payload) {
          setRows([]);
          setBreakdown(null);
          return;
        }

        let list = [];
        if (Array.isArray(payload.rows)) {
          list = payload.rows;
        } else if (statusBreakdown === 'sessions' && Array.isArray(payload.sessions)) {
          list = payload.sessions;
        } else if (statusBreakdown === 'interventions' && Array.isArray(payload.interventions)) {
          list = payload.interventions;
        } else if (Array.isArray(payload.results)) {
          list = payload.results;
        } else if (Array.isArray(payload)) {
          list = payload;
        }

        setRows(list.map((r, i) => ({ ...r, _id: r._id || i })));
        setBreakdown(payload.byStatus || payload.summary?.byStatus || null);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(appliedFilters);
  }, [appliedFilters]);

  const handleApply = (e) => {
    if (e) e.preventDefault();
    setAppliedFilters({ ...filters });
  };

  const handleReset = () => {
    const reset = {
      department: '',
      year: '',
      semester: '',
      mentor: '',
      counselor: '',
      status: '',
      priority: '',
      interventionType: '',
      assignedTo: '',
      from: '',
      to: '',
    };
    setFilters(reset);
    setAppliedFilters({});
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const cleanParams = {};
      Object.entries(appliedFilters).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined && v !== 'all') {
          cleanParams[k] = v;
        }
      });
      await downloadReportCsv(path, cleanParams, filename);
      push(`Exported ${filename} successfully.`);
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setExporting(false);
    }
  };

  const showDept = filterFields.includes('department');
  const showYear = filterFields.includes('year');
  const showSemester = filterFields.includes('semester');
  const showMentor = filterFields.includes('mentor');
  const showCounselor = filterFields.includes('counselor');
  const showStatus = filterFields.includes('status');
  const showPriority = filterFields.includes('priority');
  const showInterventionType = filterFields.includes('interventionType');
  const showDates = filterFields.includes('dates');

  return (
    <div>
      {/* Reusable Institutional Filter Bar */}
      <div
        className="record-card"
        style={{
          marginBottom: 'var(--space-4)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
        }}
      >
        <form onSubmit={handleApply}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 'var(--space-3)',
              alignItems: 'flex-end',
            }}
          >
            {showDept && (
              <div className="field" style={{ margin: 0 }}>
                <label className="field__label" style={{ fontSize: '0.78rem' }}>Department</label>
                <div className="field__select-wrap">
                  <select
                    className="field__input field__select"
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {showYear && (
              <div className="field" style={{ margin: 0 }}>
                <label className="field__label" style={{ fontSize: '0.78rem' }}>Academic Year</label>
                <div className="field__select-wrap">
                  <select
                    className="field__input field__select"
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  >
                    <option value="">All Years</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </div>
              </div>
            )}

            {showSemester && (
              <div className="field" style={{ margin: 0 }}>
                <label className="field__label" style={{ fontSize: '0.78rem' }}>Semester</label>
                <div className="field__select-wrap">
                  <select
                    className="field__input field__select"
                    value={filters.semester}
                    onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {showMentor && (
              <div className="field" style={{ margin: 0 }}>
                <label className="field__label" style={{ fontSize: '0.78rem' }}>Faculty Mentor</label>
                <div className="field__select-wrap">
                  <select
                    className="field__input field__select"
                    value={filters.mentor}
                    onChange={(e) => setFilters({ ...filters, mentor: e.target.value })}
                  >
                    <option value="">All Mentors</option>
                    {mentors.map((m) => (
                      <option key={m._id} value={m.user?._id || m._id}>{m.user?.name || 'Mentor'}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {showCounselor && (
              <div className="field" style={{ margin: 0 }}>
                <label className="field__label" style={{ fontSize: '0.78rem' }}>Counselor</label>
                <div className="field__select-wrap">
                  <select
                    className="field__input field__select"
                    value={filters.counselor}
                    onChange={(e) => setFilters({ ...filters, counselor: e.target.value })}
                  >
                    <option value="">All Counselors</option>
                    {counselors.map((c) => (
                      <option key={c._id} value={c.user?._id || c._id}>{c.user?.name || 'Counselor'}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {showPriority && (
              <div className="field" style={{ margin: 0 }}>
                <label className="field__label" style={{ fontSize: '0.78rem' }}>Risk Priority</label>
                <div className="field__select-wrap">
                  <select
                    className="field__input field__select"
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  >
                    <option value="">All Risk Tiers</option>
                    <option value="High Priority">High Priority</option>
                    <option value="Needs Attention">Needs Attention</option>
                  </select>
                </div>
              </div>
            )}

            {showStatus && (
              <div className="field" style={{ margin: 0 }}>
                <label className="field__label" style={{ fontSize: '0.78rem' }}>Status</label>
                <div className="field__select-wrap">
                  <select
                    className="field__input field__select"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">All Statuses</option>
                    <option value="Critical">Critical</option>
                    <option value="Attention Required">Attention Required</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Normal">Normal (Load)</option>
                    <option value="Full">Full (Load)</option>
                    <option value="Overloaded">Overloaded (Load)</option>
                  </select>
                </div>
              </div>
            )}

            {showInterventionType && (
              <div className="field" style={{ margin: 0 }}>
                <label className="field__label" style={{ fontSize: '0.78rem' }}>Intervention Type</label>
                <div className="field__select-wrap">
                  <select
                    className="field__input field__select"
                    value={filters.interventionType}
                    onChange={(e) => setFilters({ ...filters, interventionType: e.target.value })}
                  >
                    <option value="">All Types</option>
                    <option value="Academic Support">Academic Support</option>
                    <option value="Attendance Warning">Attendance Warning</option>
                    <option value="Counseling Referral">Counseling Referral</option>
                    <option value="Parent Contact">Parent Contact</option>
                    <option value="General Check-in">General Check-in</option>
                  </select>
                </div>
              </div>
            )}

            {showDates && (
              <>
                <div className="field" style={{ margin: 0 }}>
                  <label className="field__label" style={{ fontSize: '0.78rem' }}>From Date</label>
                  <input
                    type="date"
                    className="field__input"
                    value={filters.from}
                    onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="field__label" style={{ fontSize: '0.78rem' }}>To Date</label>
                  <input
                    type="date"
                    className="field__input"
                    value={filters.to}
                    onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <Button type="submit" size="sm" variant="primary">
                Apply Filters
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={handleReset}>
                Reset
              </Button>
              <Button type="button" size="sm" variant="secondary" loading={exporting} onClick={handleExport}>
                📥 Export CSV
              </Button>
            </div>
          </div>
        </form>
      </div>

      {loading ? (
        <Skeleton rows={4} height={40} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(appliedFilters)} />
      ) : !rows || rows.length === 0 ? (
        <EmptyState title={emptyTitle} description="No database records matched the selected query parameters." />
      ) : (
        <>
          {breakdown && Object.keys(breakdown).length > 0 && (
            <div className="grid-cards" style={{ marginBottom: 'var(--space-4)' }}>
              {Object.entries(breakdown).map(([k, v]) => (
                <StatCard
                  key={k}
                  label={k}
                  value={v}
                  tone={
                    k.toLowerCase().includes('critical') || k.toLowerCase().includes('high priority') || k.toLowerCase().includes('overloaded')
                      ? 'critical'
                      : k.toLowerCase().includes('attention') || k.toLowerCase().includes('full')
                      ? 'attention'
                      : 'accent'
                  }
                />
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
  const [departments, setDepartments] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [counselors, setCounselors] = useState([]);

  useEffect(() => {
    listDepartments().then(({ data }) => setDepartments(data.data || [])).catch(() => {});
    listMentors({ status: 'active' }).then(({ data }) => setMentors(data.data || [])).catch(() => {});
    listCounselors({ status: 'active' }).then(({ data }) => setCounselors(data.data || [])).catch(() => {});
  }, []);

  const tabs = [
    {
      id: 'attention',
      label: 'Students Needing Attention',
      content: (
        <ReportPanel
          path="/reports/students-needing-attention"
          filename="students-needing-attention.csv"
          fetcher={getStudentsNeedingAttention}
          emptyTitle="No students currently need attention."
          filterFields={['department', 'year', 'semester', 'mentor', 'priority']}
          departments={departments}
          mentors={mentors}
          columns={[
            {
              key: 'student',
              header: 'Student ID',
              render: (r) => <strong style={{ color: 'var(--color-accent-strong)' }}>{r.studentId || r.student || '—'}</strong>,
            },
            { key: 'studentName', header: 'Student Name', render: (r) => r.studentName || '—' },
            { key: 'department', header: 'Department', render: (r) => r.department?.name || r.department || '—' },
            { key: 'year', header: 'Year', render: (r) => (r.year ? `Year ${r.year}` : '—') },
            { key: 'semester', header: 'Sem', render: (r) => (r.semester ? `Sem ${r.semester}` : '—') },
            { key: 'mentor', header: 'Mentor', render: (r) => r.mentor || 'Unassigned' },
            {
              key: 'attendancePercentage',
              header: 'Attendance %',
              render: (r) => (
                <strong className="tabular-nums" style={{ color: (r.attendancePercentage ?? 0) < 75 ? 'var(--color-critical)' : 'inherit' }}>
                  {r.attendancePercentage ?? 0}%
                </strong>
              ),
            },
            { key: 'gpa', header: 'GPA', render: (r) => <span className="tabular-nums">{r.gpa ?? '—'}</span> },
            {
              key: 'arrears',
              header: 'Arrears',
              render: (r) => (
                <span className="tabular-nums" style={{ color: (r.arrears ?? 0) > 0 ? 'var(--color-critical)' : 'inherit', fontWeight: 600 }}>
                  {r.arrears ?? 0}
                </span>
              ),
            },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} size="sm" /> },
            {
              key: 'reasons',
              header: 'Reasons',
              render: (r) => {
                const list = Array.isArray(r.reasons)
                  ? r.reasons
                  : (typeof r.reasons === 'string' ? r.reasons.split(' | ') : []);
                return (
                  <ul className="reason-list" style={{ margin: 0, paddingLeft: 14 }}>
                    {list.map((rsn, idx) => <li key={idx}>{rsn}</li>)}
                  </ul>
                );
              },
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
          path="/reports/attendance-concerns"
          filename="attendance-concerns.csv"
          fetcher={getAttendanceConcerns}
          emptyTitle="No attendance concerns flagged at this time."
          filterFields={['department', 'year', 'semester', 'mentor', 'status']}
          departments={departments}
          mentors={mentors}
          columns={[
            {
              key: 'student',
              header: 'Student ID',
              render: (r) => <strong style={{ color: 'var(--color-accent-strong)' }}>{r.studentId || r.student || '—'}</strong>,
            },
            { key: 'studentName', header: 'Student Name', render: (r) => r.studentName || '—' },
            { key: 'department', header: 'Department', render: (r) => r.department?.name || r.department || '—' },
            { key: 'year', header: 'Year', render: (r) => (r.year ? `Year ${r.year}` : '—') },
            { key: 'semester', header: 'Semester', render: (r) => (r.semester ? `Sem ${r.semester}` : '—') },
            { key: 'mentor', header: 'Mentor', render: (r) => r.mentor || 'Unassigned' },
            {
              key: 'percentage',
              header: 'Attendance %',
              render: (r) => (
                <strong className="tabular-nums" style={{ color: (r.percentage ?? 0) < 75 ? 'var(--color-critical)' : 'var(--color-attention)' }}>
                  {r.percentage ?? r.attendancePercentage ?? 0}%
                </strong>
              ),
            },
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
          path="/reports/academic-concerns"
          filename="academic-concerns.csv"
          fetcher={getAcademicConcerns}
          emptyTitle="No academic concerns flagged at this time."
          filterFields={['department', 'year', 'semester', 'mentor', 'status']}
          departments={departments}
          mentors={mentors}
          columns={[
            {
              key: 'student',
              header: 'Student ID',
              render: (r) => <strong style={{ color: 'var(--color-accent-strong)' }}>{r.studentId || r.student || '—'}</strong>,
            },
            { key: 'studentName', header: 'Student Name', render: (r) => r.studentName || '—' },
            { key: 'department', header: 'Department', render: (r) => r.department?.name || r.department || '—' },
            { key: 'mentor', header: 'Mentor', render: (r) => r.mentor || 'Unassigned' },
            { key: 'gpa', header: 'GPA', render: (r) => <strong className="tabular-nums">{r.gpa ?? '—'}</strong> },
            {
              key: 'arrears',
              header: 'Arrears',
              render: (r) => (
                <span className="tabular-nums" style={{ color: (r.arrears ?? 0) > 0 ? 'var(--color-critical)' : 'inherit', fontWeight: 600 }}>
                  {r.arrears ?? 0}
                </span>
              ),
            },
            {
              key: 'academicStatus',
              header: 'Academic Status',
              render: (r) => <Badge status={r.academicStatus || ((r.arrears ?? 0) > 0 ? 'Critical' : 'Needs Attention')} size="sm" />,
            },
          ]}
        />
      ),
    },
    {
      id: 'counseling',
      label: 'Counseling Activity',
      content: (
        <ReportPanel
          path="/reports/counseling-activity"
          filename="counseling-activity.csv"
          fetcher={getCounselingActivity}
          emptyTitle="No counseling sessions recorded."
          statusBreakdown="sessions"
          filterFields={['counselor', 'status', 'dates']}
          counselors={counselors}
          columns={[
            { key: 'student', header: 'Student ID', render: (r) => r.studentId || r.student || '—' },
            { key: 'studentName', header: 'Student Name', render: (r) => r.studentName || '—' },
            { key: 'conductedBy', header: 'Counselor', render: (r) => r.conductedBy?.name || r.conductedBy || r.counselor || 'Counselor' },
            { key: 'date', header: 'Date', render: (r) => (r.date ? new Date(r.date).toLocaleDateString() : '—') },
            { key: 'sessionType', header: 'Session Type', render: (r) => <strong>{r.sessionType || 'General'}</strong> },
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
          path="/reports/intervention-status"
          filename="intervention-status.csv"
          fetcher={getInterventionStatus}
          emptyTitle="No interventions recorded."
          statusBreakdown="interventions"
          filterFields={['interventionType', 'status']}
          columns={[
            { key: 'student', header: 'Student ID', render: (r) => r.studentId || r.student || '—' },
            { key: 'studentName', header: 'Student Name', render: (r) => r.studentName || '—' },
            { key: 'interventionType', header: 'Intervention Type', render: (r) => <strong>{r.interventionType || r.type || '—'}</strong> },
            { key: 'assignedTo', header: 'Assigned To', render: (r) => r.assignedTo?.name || r.assignedTo || 'Mentor' },
            { key: 'assignedRole', header: 'Assigned Role', render: (r) => <span style={{ textTransform: 'capitalize' }}>{r.assignedRole || 'mentor'}</span> },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} size="sm" /> },
            { key: 'followUpDate', header: 'Follow-up Date', render: (r) => (r.followUpDate ? new Date(r.followUpDate).toLocaleDateString() : '—') },
          ]}
        />
      ),
    },
    {
      id: 'workload',
      label: 'Mentor Workload',
      content: (
        <ReportPanel
          path="/reports/mentor-workload"
          filename="mentor-workload.csv"
          fetcher={getMentorWorkload}
          emptyTitle="No mentor workload data."
          filterFields={['department', 'status']}
          departments={departments}
          columns={[
            { key: 'mentor', header: 'Mentor', render: (r) => <strong>{r.mentor || 'Faculty Mentor'}</strong> },
            { key: 'email', header: 'Email', render: (r) => r.email || '—' },
            { key: 'department', header: 'Department', render: (r) => r.department || '—' },
            { key: 'currentLoad', header: 'Current Load', render: (r) => <span className="tabular-nums" style={{ fontWeight: 600 }}>{r.currentLoad ?? 0}</span> },
            { key: 'maxCapacity', header: 'Max Capacity', render: (r) => <span className="tabular-nums">{r.maxCapacity ?? r.capacity ?? r.maxLoad ?? 25}</span> },
            { key: 'remainingCapacity', header: 'Remaining', render: (r) => <span className="tabular-nums">{r.remainingCapacity ?? 0}</span> },
            { key: 'utilization', header: 'Utilization %', render: (r) => <strong className="tabular-nums">{r.utilization ?? 0}%</strong> },
            {
              key: 'status',
              header: 'Status',
              render: (r) => (
                <Badge status={r.status === 'Normal' ? 'Stable' : r.status === 'Full' ? 'Attention Required' : 'Critical'}>
                  {r.status || 'Normal'}
                </Badge>
              ),
            },
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
