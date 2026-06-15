import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import useProfile from '../hooks/useProfile';

const defaultSidebarItems = [
  { label: 'Dashboard', to: '/dashboard', end: true },
  { label: 'My Courses', to: '/dashboard/courses' },
  { label: 'Notice Board', to: '/dashboard/notice-board' },
  { label: 'Notes Library', to: '/dashboard/notes-library' },
  { label: 'Messages', to: '/dashboard/messages' },
  { label: 'Profile', to: '/dashboard/profile' },
  { label: 'Club', to: '/dashboard/club' },
  { label: 'Settings', to: '/dashboard/settings' },
];

const defaultFeatureTools = [
  { label: 'Job Board', to: '/dashboard/job-board', badge: 'New' },
  { label: 'Mock Tests', to: '/dashboard/mock-tests', badge: 'New' },
  { label: 'Live Classes', to: '/dashboard/live-classes', badge: 'New' },
  { label: 'AI Assistant', to: '/dashboard/ai-assistant', badge: 'New' },
  { label: 'Alumni Network', to: '/dashboard/alumni', badge: 'New' },
  { label: 'Scholarships', to: '/dashboard/scholarships', badge: 'New' },
];

const facultySidebarItems = [
  { label: 'Dashboard', to: '/dashboard', end: true },
  { label: 'Teaching Courses', to: '/dashboard/courses' },
  { label: 'Notice Board', to: '/dashboard/notice-board' },
  { label: 'Messages', to: '/dashboard/messages' },
  { label: 'Profile', to: '/dashboard/profile' },
  { label: 'Settings', to: '/dashboard/settings' },
];

const facultyFeatureTools = [
  { label: 'Live Classes', to: '/dashboard/live-classes', badge: 'Host' },
  { label: 'AI Assistant', to: '/dashboard/ai-assistant', badge: 'New' },
  { label: 'Alumni Network', to: '/dashboard/alumni', badge: 'New' },
];

const adminSidebarItems = [
  { label: 'Dashboard', to: '/dashboard', end: true },
  { label: 'Notice Board', to: '/dashboard/notice-board' },
  { label: 'Messages', to: '/dashboard/messages' },
  { label: 'Profile', to: '/dashboard/profile' },
  { label: 'Settings', to: '/dashboard/settings' },
];

const adminFeatureTools = [
  { label: 'AI Assistant', to: '/dashboard/ai-assistant' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  
  const [noticesCount, setNoticesCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  const getToken = async () => {
    const mockToken = localStorage.getItem('campushub_mock_token');
    if (mockToken) return mockToken;
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  useEffect(() => {
    let active = true;
    const fetchCounts = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        // Fetch notices
        const noticesRes = await fetch('/api/notices', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (noticesRes.ok) {
          const noticesData = await noticesRes.json();
          if (active) {
            setNoticesCount(noticesData.notices?.length || 0);
          }
        }

        // Fetch messages
        const messagesRes = await fetch('/api/messages', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          if (active) {
            setMessagesCount(messagesData.conversations?.length || 0);
          }
        }
      } catch (err) {
        console.error('Failed to load counts:', err);
      }
    };

    if (profile) {
      fetchCounts();
    }
    return () => {
      active = false;
    };
  }, [profile]);

  const isFaculty = profile?.role === 'faculty';
  const isAdmin = profile?.role === 'admin';
  
  const sidebarItems = useMemo(() => {
    const rawItems = isAdmin ? adminSidebarItems : isFaculty ? facultySidebarItems : defaultSidebarItems;
    return rawItems.map((item) => {
      if (item.label === 'Notice Board') {
        return { ...item, badge: noticesCount > 0 ? String(noticesCount) : null };
      }
      if (item.label === 'Messages') {
        return { ...item, badge: messagesCount > 0 ? String(messagesCount) : null };
      }
      return item;
    });
  }, [isAdmin, isFaculty, noticesCount, messagesCount]);

  const featureTools = isAdmin ? adminFeatureTools : isFaculty ? facultyFeatureTools : defaultFeatureTools;
  
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

        <div className="sidebar-section" style={{ borderTop: '1px solid #eaecf0', paddingTop: '12px', marginTop: '12px' }}>
          <div className="sidebar-section-title">NOTIFICATIONS</div>
          <div style={{ padding: '6px 16px', fontSize: '13px', color: '#667085', fontWeight: '500' }}>
            {noticesCount + messagesCount > 0 ? (
              <span style={{ color: 'var(--accent-color, #f05a28)', fontWeight: '600' }}>
                🔔 {noticesCount + messagesCount} New Notification{noticesCount + messagesCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span>No new notifications</span>
            )}
          </div>
        </div>

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