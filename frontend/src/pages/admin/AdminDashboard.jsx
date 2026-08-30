import { useEffect, useState } from 'react';
import { getAdminDashboard } from '../../services/dashboard.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import SimpleBarChart from '../../components/SimpleBarChart';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton rows={6} height={50} />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1>Institution Overview</h1>
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        <StatCard label="Active Students" value={data.totalStudents} />
        <StatCard label="Mentors" value={data.totalMentors} />
        <StatCard label="Counselors" value={data.totalCounselors} />
        <StatCard label="Active Interventions" value={data.activeInterventions} tone="attention" />
        <StatCard label="Counseling This Month" value={data.counselingThisMonth} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        <StatCard label="Stable" value={data.statusBreakdown.Stable || 0} tone="stable" />
        <StatCard label="Needs Attention" value={data.statusBreakdown['Needs Attention'] || 0} tone="attention" />
        <StatCard label="High Priority" value={data.statusBreakdown['High Priority'] || 0} tone="critical" />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        <div style={{ flex: 1, minWidth: 280 }} className="record-card">
          <SimpleBarChart
            title="Students by Priority"
            data={[
              { label: 'Stable', value: data.statusBreakdown.Stable || 0, color: 'var(--color-stable)' },
              { label: 'Needs Attention', value: data.statusBreakdown['Needs Attention'] || 0, color: 'var(--color-attention)' },
              { label: 'High Priority', value: data.statusBreakdown['High Priority'] || 0, color: 'var(--color-critical)' },
            ]}
          />
        </div>
        <div style={{ flex: 1, minWidth: 280 }} className="record-card">
          <SimpleBarChart
            title="Students by Department"
            data={data.departmentStats.map((d) => ({ label: d.code, value: d.studentCount }))}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <h2>Department Breakdown</h2>
          <DataTable
            columns={[
              { key: 'department', header: 'Department' },
              { key: 'code', header: 'Code' },
              { key: 'studentCount', header: 'Active Students' },
            ]}
            rows={data.departmentStats.map((d, i) => ({ ...d, _id: i }))}
          />
        </div>
        <div style={{ flex: 1, minWidth: 300 }}>
          <h2>Mentor Workload</h2>
          <DataTable
            columns={[
              { key: 'mentor', header: 'Mentor' },
              { key: 'count', header: 'Assigned' },
              { key: 'maxLoad', header: 'Capacity' },
            ]}
            rows={data.mentorWorkload.map((m, i) => ({ ...m, _id: i }))}
          />
        </div>
      </div>
    </div>
  );
}
