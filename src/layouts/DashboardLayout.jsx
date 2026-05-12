import { useMemo } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import useProfile from '../hooks/useProfile';

const sidebarItems = [
  { label: 'Dashboard', to: '/dashboard', end: true },
  { label: 'My Courses', to: '/dashboard/courses' },
  { label: 'Notice Board', to: '/dashboard/notice-board', badge: '5' },
  { label: 'Notes Library', to: '/dashboard/notes-library' },
  { label: 'Messages', to: '/dashboard/messages', badge: '3' },
  { label: 'Profile', to: '/dashboard/profile' },
  { label: 'Club', to: '/dashboard/club' },
  { label: 'Settings', to: '/dashboard/settings' },
];

const featureTools = [
  { label: 'Job Board', to: '/dashboard/job-board', badge: 'New' },
  { label: 'Mock Tests', to: '/dashboard/mock-tests', badge: 'New' },
  { label: 'Live Classes', to: '/dashboard/live-classes', badge: 'New' },
  { label: 'AI Assistant', to: '/dashboard/ai-assistant', badge: 'New' },
  { label: 'Alumni Network', to: '/dashboard/alumni', badge: 'New' },
  { label: 'Scholarships', to: '/dashboard/scholarships', badge: 'New' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const profileName =
    profile?.name ||
    profile?.fullName ||
    auth.currentUser?.displayName ||
    auth.currentUser?.email?.split('@')[0] ||
    'Student';
  const profileMeta =
    profile?.profile?.department && profile?.profile?.year
      ? `${profile.profile.department}, ${profile.profile.year}`
      : profile?.role
        ? `${profile.role.charAt(0).toUpperCase()}${profile.role.slice(1)}`
        : profile?.email || auth.currentUser?.email || '';

  const profileInitials = useMemo(() => {
    if (!profileName) {
      return 'ST';
    }

    const parts = profileName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [profileName]);

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
              <NavLink
                key={tool.label}
                to={tool.to}
                className={({ isActive }) => `sidebar-item sidebar-tool ${isActive ? 'active' : ''}`}
              >
                <span>{tool.label}</span>
                <span className="sidebar-new">{tool.badge}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <button type="button" className="profile-card" onClick={() => navigate('/dashboard/profile')}>
          <span className="profile-avatar">{profileInitials}</span>
          <span>
            <strong>{profileName}</strong>
            <small>{profileMeta || 'CSE, 3rd Year'}</small>
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