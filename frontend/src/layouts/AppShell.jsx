import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/NotificationBell';
import ChangePasswordModal from '../components/ChangePasswordModal';
import './AppShell.css';

const NAV_BY_ROLE = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/students', label: 'Students' },
    { to: '/admin/mentors', label: 'Mentors' },
    { to: '/admin/counselors', label: 'Counselors' },
    { to: '/admin/departments', label: 'Departments' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/audit-log', label: 'Audit Log' },
  ],
  mentor: [
    { to: '/mentor/dashboard', label: 'Dashboard' },
    { to: '/mentor/students', label: 'My Students' },
    { to: '/mentor/counseling', label: 'Counseling' },
    { to: '/mentor/interventions', label: 'Interventions' },
    { to: '/mentor/followups', label: 'Follow-ups' },
    { to: '/mentor/appointments', label: 'Appointments' },
  ],
  counselor: [
    { to: '/counselor/dashboard', label: 'Dashboard' },
    { to: '/counselor/cases', label: 'Cases' },
    { to: '/counselor/appointments', label: 'Appointments' },
  ],
  student: [
    { to: '/student/dashboard', label: 'Dashboard' },
    { to: '/student/profile', label: 'My Profile' },
    { to: '/student/counseling', label: 'Counseling' },
    { to: '/student/interventions', label: 'Support' },
    { to: '/student/appointments', label: 'Meeting Requests' },
  ],
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const navItems = NAV_BY_ROLE[user?.role] || [];
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__brand">
          <span className="app-shell__brand-mark" aria-hidden="true">◆</span>
          <span>MentorPath</span>
        </div>
        <nav className="app-shell__nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `app-shell__nav-link ${isActive ? 'app-shell__nav-link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-shell__user">
          <div className="app-shell__user-name">{user?.name}</div>
          <div className="app-shell__user-role">{user?.role}</div>
          <button type="button" className="app-shell__change-password" onClick={() => setShowChangePassword(true)}>
            Change password
          </button>
          <button type="button" className="app-shell__logout" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="app-shell__main">
        <div className="container">
          <div className="app-shell__topbar">
            <NotificationBell />
          </div>
          <Outlet />
        </div>
      </main>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}
