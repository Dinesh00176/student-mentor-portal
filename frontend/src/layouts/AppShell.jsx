import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/NotificationBell';
import ChangePasswordModal from '../components/ChangePasswordModal';
import Badge from '../components/Badge';
import './AppShell.css';

const NAV_ICONS = {
  Dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Students: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  'My Students': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  ),
  Mentors: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  Counselors: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Departments: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M3 7v14" />
      <path d="M13 7v14" />
      <path d="M21 7v14" />
      <path d="M2 7h20" />
      <path d="M12 2L2 7h20L12 2z" />
    </svg>
  ),
  Reports: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  'Audit Log': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Counseling: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Cases: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Interventions: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  'Follow-ups': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Appointments: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 14 14" />
    </svg>
  ),
  'Meeting Requests': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 14 14" />
    </svg>
  ),
  'My Profile': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Support: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

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

function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getGreetingName(name) {
  if (!name) return 'User';
  const parts = name.trim().split(/\s+/);
  const honorifics = ['dr.', 'dr', 'mr.', 'mr', 'ms.', 'ms', 'mrs.', 'mrs', 'prof.', 'prof'];
  if (parts.length > 1 && honorifics.includes(parts[0].toLowerCase())) {
    return `${parts[0]} ${parts[1]}`;
  }
  return parts[0];
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navItems = NAV_BY_ROLE[user?.role] || [];
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="app-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="app-shell__backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`app-shell__sidebar ${mobileMenuOpen ? 'app-shell__sidebar--open' : ''}`}>
        <div className="app-shell__brand">
          <div className="app-shell__brand-logo" aria-hidden="true">
            <span>MP</span>
          </div>
          <div className="app-shell__brand-text">
            <span className="app-shell__brand-title">MentorPath</span>
            <span className="app-shell__brand-sub">Academic & Counseling</span>
          </div>
        </div>

        <nav className="app-shell__nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const icon = NAV_ICONS[item.label] || null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `app-shell__nav-link ${isActive ? 'app-shell__nav-link--active' : ''}`
                }
              >
                {icon && <span className="app-shell__nav-icon" aria-hidden="true">{icon}</span>}
                <span className="app-shell__nav-text">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card at Bottom of Sidebar */}
        <div className="app-shell__user-card">
          <div className="app-shell__user-info">
            <div className="app-shell__avatar" aria-hidden="true">
              {getInitials(user?.name)}
            </div>
            <div className="app-shell__user-details">
              <div className="app-shell__user-name" title={user?.name}>
                {user?.name || 'User'}
              </div>
              <div className="app-shell__user-role-badge">
                <span className="app-shell__role-tag">{user?.role}</span>
              </div>
            </div>
          </div>
          <div className="app-shell__user-actions">
            <button
              type="button"
              className="app-shell__action-link"
              onClick={() => setShowChangePassword(true)}
            >
              Change password
            </button>
            <button type="button" className="app-shell__logout-btn" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-shell__main-wrapper">
        <header className="app-shell__topbar">
          <button
            type="button"
            className="app-shell__mobile-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="app-shell__topbar-left">
            <span className="app-shell__greeting">
              Welcome back, <strong>{getGreetingName(user?.name)}</strong>
            </span>
            <span className="app-shell__topbar-date">{formattedDate}</span>
          </div>

          <div className="app-shell__topbar-right">
            <NotificationBell />
          </div>
        </header>

        <main className="app-shell__content">
          <div className="container">
            <Outlet />
          </div>
        </main>
      </div>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}
