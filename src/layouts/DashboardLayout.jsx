import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const sidebarItems = [
  { label: 'Dashboard', to: '/dashboard', end: true },
  { label: 'Notice Board', to: '/dashboard/notice-board', badge: '5' },
  { label: 'Notes Library', to: '/dashboard/notes-library' },
  { label: 'Messages', to: '/dashboard/messages', badge: '3' },
  { label: 'Community', to: '/dashboard/community' },
  { label: 'Profile', to: '/dashboard/profile' },
  { label: 'Club', to: '/dashboard/club' },
  { label: 'Premium', to: '/dashboard/premium' },
];

const featureTools = ['Job Board', 'Mock Tests', 'Live Classes', 'AI Assistant'];

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Redirect anyway so the user can log in again even if client sign-out throws.
    } finally {
      navigate('/auth', { replace: true, state: { mode: 'login' } });
    }
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">⌂</span>
          <span>CampusHUB</span>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span>{item.label}</span>
              {item.badge ? <span className="sidebar-badge">{item.badge}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-section">
          <div className="sidebar-section-title">NEW FEATURES</div>
          <div className="sidebar-tools">
            {featureTools.map((tool) => (
              <button key={tool} type="button" className="sidebar-tool">
                <span>{tool}</span>
                <span className="sidebar-new">New</span>
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="profile-card" onClick={() => navigate('/dashboard/profile')}>
          <span className="profile-avatar">JS</span>
          <span>
            <strong>John Student</strong>
            <small>CSE, 3rd Year</small>
          </span>
        </button>

        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}