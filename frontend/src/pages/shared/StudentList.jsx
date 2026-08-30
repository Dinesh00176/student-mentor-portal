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

  useEffect(() => {
    setLoading(true);
    setError('');
    listStudents({ q: debouncedQuery, department, status, page, limit: 10 })
      .then(({ data }) => setResult(data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [debouncedQuery, department, status, page]);

  const columns = [
    { key: 'studentCode', header: 'Student ID' },
    { key: 'name', header: 'Name', render: (r) => r.user?.name || '—' },
    { key: 'department', header: 'Department', render: (r) => r.department?.name || '—' },
    { key: 'year', header: 'Year / Sem', render: (r) => `Y${r.year} / S${r.semester}` },
    { key: 'mentor', header: 'Mentor', render: (r) => r.assignedMentor?.name || 'Unassigned' },
    {
      key: 'enrollmentStatus',
      header: 'Status',
      render: (r) => <Badge status={r.enrollmentStatus === 'active' ? 'Stable' : r.enrollmentStatus}>{r.enrollmentStatus}</Badge>,
    },
  ];

  return (
    <div>
      <h1>Students</h1>
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <div style={{ minWidth: 220, flex: 1 }}>
          <Field htmlFor="q" label="Search">
            <Input id="q" placeholder="Name, student ID, or email" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </Field>
        </div>
        {showDepartmentFilter && (
          <div style={{ minWidth: 180 }}>
            <Field htmlFor="dept" label="Department">
              <Select
                id="dept"
                placeholder="All departments"
                value={department}
                onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                options={departments.map((d) => ({ value: d._id, label: d.name }))}
              />
            </Field>
          </div>
        )}
        <div style={{ minWidth: 160 }}>
          <Field htmlFor="status" label="Enrollment">
            <Select
              id="status"
              placeholder="All statuses"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'graduated', label: 'Graduated' },
              ]}
            />
          </Field>
        </div>
      </div>

      {loading && <Skeleton rows={5} height={40} />}
      {!loading && error && <ErrorState message={error} onRetry={() => setPage((p) => p)} />}
      {!loading && !error && result && result.items.length === 0 && (
        <EmptyState title="No students found" description="Try adjusting your search or filters." />
      )}
      {!loading && !error && result && result.items.length > 0 && (
        <>
          <DataTable columns={columns} rows={result.items} onRowClick={(r) => navigate(`${basePath}/${r._id}`)} />
          <Pagination pagination={result.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
