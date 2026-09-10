import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../../services/dashboard.service';
import { getErrorMessage } from '../../services/api';
import Skeleton from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import SimpleBarChart from '../../components/SimpleBarChart';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getAdminDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <Skeleton rows={6} height={50} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Institutional Governance &amp; Health</h1>
          <p className="page-header__subtitle">
            Enterprise overview: department metrics, cohort risks, counseling utilization, and mentor workload.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button as={Link} to="/admin/students" variant="primary" size="sm">
            Manage Students
          </Button>
          <Button as={Link} to="/admin/reports" variant="secondary" size="sm">
            Generate Reports
          </Button>
        </div>
      </div>

      {/* Primary KPI Overview */}
      <div className="grid-cards" style={{ marginBottom: 'var(--space-4)' }}>
        <StatCard
          label="Active Students"
          value={data.activeStudentsCount ?? data.totalStudents}
          tone="accent"
          trend={`${data.inactiveStudentsCount || 0} inactive`}
        />
        <StatCard
          label="Faculty Mentors"
          value={data.activeMentorsCount ?? data.totalMentors}
          tone="accent"
          trend={`${data.totalMentors || 0} registered`}
        />
        <StatCard
          label="Wellness Counselors"
          value={data.activeCounselorsCount ?? data.totalCounselors}
          tone="accent"
          trend={`${data.totalCounselors || 0} registered`}
        />
        <StatCard
          label="Active Interventions"
          value={data.activeInterventions}
          tone={data.activeInterventions > 0 ? 'attention' : 'stable'}
          trend="Action items"
        />
        <StatCard
          label="Counseling This Month"
          value={data.counselingThisMonth}
          tone="info"
          trend="Sessions"
        />
      </div>

      {/* Risk Distribution Breakdown */}
      <div className="grid-cards" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          label="Stable Cohort"
          value={data.statusBreakdown.Stable || 0}
          tone="stable"
          trend="On track"
        />
        <StatCard
          label="Needs Attention"
          value={data.statusBreakdown['Needs Attention'] || 0}
          tone="attention"
          trend="Flagged"
        />
        <StatCard
          label="High Priority / Critical Risk"
          value={data.statusBreakdown['High Priority'] || 0}
          tone="critical"
          trend="Urgent action"
        />
      </div>

      {/* Analytics Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        <div className="record-card">
          <SimpleBarChart
            title="Student Cohort by Attention Level"
            subtitle="Rule-based risk classification across all departments"
            data={[
              { label: 'Stable', value: data.statusBreakdown.Stable || 0, color: 'var(--color-stable)' },
              { label: 'Needs Attention', value: data.statusBreakdown['Needs Attention'] || 0, color: 'var(--color-attention)' },
              { label: 'High Priority', value: data.statusBreakdown['High Priority'] || 0, color: 'var(--color-critical)' },
            ]}
          />
        </div>
        <div className="record-card">
          <SimpleBarChart
            title="Student Enrollment by Department"
            subtitle="Distribution of registered students across academic units"
            data={data.departmentStats.map((d) => ({
              label: d.code,
              value: d.studentCount,
              color: 'var(--color-accent)',
            }))}
          />
        </div>
      </div>

      {/* Department & Mentor Load Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Academic Department Units</h2>
            <Link to="/admin/departments" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Manage All →</Link>
          </div>
          <DataTable
            columns={[
              { key: 'department', header: 'Department Name', render: (r) => <strong>{r.department}</strong> },
              { key: 'code', header: 'Code', render: (r) => <Badge status="info" size="sm">{r.code}</Badge> },
              { key: 'studentCount', header: 'Active Students', render: (r) => <span className="tabular-nums">{r.studentCount}</span> },
            ]}
            rows={data.departmentStats.map((d, i) => ({ ...d, _id: i }))}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Mentor Workload Utilization</h2>
            <Link to="/admin/mentors" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Manage Mentors →</Link>
          </div>
          <DataTable
            columns={[
              { key: 'mentor', header: 'Faculty Mentor', render: (r) => <strong>{r.mentor}</strong> },
              {
                key: 'count',
                header: 'Assigned / Capacity',
                render: (r) => (
                  <span className="tabular-nums">
                    {r.count} <span style={{ color: 'var(--color-ink-faint)', fontSize: '0.8rem' }}>/ {r.maxLoad}</span>
                  </span>
                ),
              },
              {
                key: 'utilization',
                header: 'Load Ratio',
                render: (r) => {
                  const ratio = Math.round((r.count / (r.maxLoad || 1)) * 100);
                  const tone = ratio > 90 ? 'critical' : ratio > 75 ? 'attention' : 'stable';
                  return <Badge status={tone === 'critical' ? 'Critical' : tone === 'attention' ? 'Attention Required' : 'Stable'} size="sm">{ratio}%</Badge>;
                },
              },
            ]}
            rows={data.mentorWorkload.map((m, i) => ({ ...m, _id: i }))}
          />
        </div>
      </div>
    </div>
  );
}
