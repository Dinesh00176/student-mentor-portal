import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listStudents } from '../../services/student.service';
import { listDepartments } from '../../services/department.service';
import { getErrorMessage } from '../../services/api';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Skeleton from '../../components/Skeleton';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { Field, Input, Select } from '../../components/FormField';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

// Shared between /admin/students and /mentor/students - the mentor view is
// scoped server-side (backend filters to assigned students automatically).
export default function StudentList({ basePath, showDepartmentFilter = true }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (showDepartmentFilter) {
      listDepartments().then(({ data }) => setDepartments(data.data)).catch(() => {});
    }
  }, [showDepartmentFilter]);

  const load = () => {
    setLoading(true);
    setError('');
    listStudents({ q: debouncedQuery, department, status, page, limit: 10 })
      .then(({ data }) => setResult(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [debouncedQuery, department, status, page]);

  const clearFilters = () => {
    setQuery('');
    setDepartment('');
    setStatus('');
    setPage(1);
  };

  const columns = [
    {
      key: 'studentCode',
      header: 'Student ID',
      render: (r) => <strong className="tabular-nums" style={{ color: 'var(--color-accent-strong)' }}>{r.studentCode}</strong>,
    },
    {
      key: 'name',
      header: 'Student Name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.user?.name || '—'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-faint)' }}>{r.user?.email}</div>
        </div>
      ),
    },
    { key: 'department', header: 'Department', render: (r) => r.department?.name || '—' },
    {
      key: 'year',
      header: 'Year / Sem',
      render: (r) => <span className="tabular-nums">Year {r.year}, Sem {r.semester}</span>,
    },
    {
      key: 'mentor',
      header: 'Assigned Mentor',
      render: (r) => r.assignedMentor ? <span>{r.assignedMentor.name}</span> : <span style={{ color: 'var(--color-ink-faint)', fontStyle: 'italic' }}>Unassigned</span>,
    },
    {
      key: 'enrollmentStatus',
      header: 'Status',
      render: (r) => <Badge status={r.enrollmentStatus === 'active' ? 'Stable' : r.enrollmentStatus} size="sm">{r.enrollmentStatus}</Badge>,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Student Directory</h1>
          <p className="page-header__subtitle">Manage and track student progress, academic records, and mentoring assignments.</p>
        </div>
      </div>

      <div className="record-card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 240, flex: 2 }}>
            <Field htmlFor="q" label="Search Student">
              <Input
                id="q"
                placeholder="Search by name, student code, or email..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </Field>
          </div>
          {showDepartmentFilter && (
            <div style={{ minWidth: 180, flex: 1 }}>
              <Field htmlFor="dept" label="Department">
                <Select
                  id="dept"
                  placeholder="All departments"
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setPage(1);
                  }}
                  options={departments.map((d) => ({ value: d._id, label: d.name }))}
                />
              </Field>
            </div>
          )}
          <div style={{ minWidth: 160, flex: 1 }}>
            <Field htmlFor="status" label="Enrollment Status">
              <Select
                id="status"
                placeholder="All statuses"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'graduated', label: 'Graduated' },
                ]}
              />
            </Field>
          </div>
          {(query || department || status) && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {loading && <Skeleton rows={6} height={42} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && result && result.items.length === 0 && (
        <EmptyState
          title="No students match your query"
          description="Try adjusting your search keywords or clearing department/status filters."
          action={(query || department || status) ? <Button size="sm" variant="secondary" onClick={clearFilters}>Reset Filters</Button> : null}
        />
      )}
      {!loading && !error && result && result.items.length > 0 && (
        <>
          <DataTable
            columns={columns}
            rows={result.items}
            onRowClick={(r) => navigate(`${basePath}/${r._id}`)}
          />
          <Pagination pagination={result.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
