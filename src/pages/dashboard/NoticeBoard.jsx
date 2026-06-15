import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { auth } from '../../firebase';
import useProfile from '../../hooks/useProfile';

const filters = ['All', 'Exam', 'Holiday', 'Event', 'General'];

const fallbackNotices = [
  {
    id: 'fallback-1',
    title: 'Mid-term Examination Schedule Released',
    body:
      'The mid-term examination for all departments will commence from January 15, 2026. Students are advised to check the detailed schedule on the portal.',
    category: 'Exam',
    priority: 'High',
    publishAt: '2026-01-04T09:00:00.000Z',
  },
  {
    id: 'fallback-2',
    title: 'Campus Holiday - Republic Day',
    body:
      'The campus will remain closed on January 26, 2026, in observance of Republic Day. All classes and activities are suspended for the day.',
    category: 'Holiday',
    priority: 'Medium',
    publishAt: '2026-01-03T09:00:00.000Z',
  },
  {
    id: 'fallback-3',
    title: 'Tech Fest 2026 Registration Open',
    body:
      'Registration for the annual Tech Fest 2026 is now open. Submit your innovative projects and participate in exciting competitions. Last date: January 10, 2026.',
    category: 'Event',
    priority: 'Medium',
    publishAt: '2026-01-02T09:00:00.000Z',
  },
];

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatRelative = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / 36e5));

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

const getPriorityLabelClass = (priority) => {
  if (priority === 'High') {
    return 'priority-pill high';
  }
  if (priority === 'Low') {
    return 'priority-pill low';
  }
  return 'priority-pill medium';
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
};

const modalContentStyle = {
  backgroundColor: '#ffffff',
  padding: '28px',
  borderRadius: '16px',
  width: '90%',
  maxWidth: '500px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  boxSizing: 'border-box',
};

const formGroupStyle = {
  marginBottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#344054',
};

const inputStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #d0d5dd',
  fontSize: '15px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

export default function NoticeBoard() {
  const { profile } = useProfile();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [notices, setNotices] = useState(fallbackNotices);
  const [loading, setLoading] = useState(true);

  // Notice creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (location.state?.openCreateModal) {
      Promise.resolve().then(() => {
        setShowCreateModal(true);
      });
    }
  }, [location]);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    body: '',
    category: 'General',
    priority: 'Medium',
  });

  const getToken = async () => {
    const mockToken = localStorage.getItem('campushub_mock_token');
    if (mockToken) return mockToken;
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const loadNotices = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setNotices(fallbackNotices);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (activeFilter && activeFilter !== 'All') {
        params.set('category', activeFilter);
      }
      if (query) {
        params.set('q', query);
      }

      const response = await fetch(`/api/notices?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Unable to load notices');
      }

      const payload = await response.json();
      setNotices(payload.notices || []);
    } catch (err) {
      console.error(err);
      setNotices(fallbackNotices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadNotices();
      }
    });
    return () => {
      active = false;
    };
  }, [activeFilter, query]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.title.trim() || !createForm.body.trim()) {
      setCreateError('Title and Body are required.');
      return;
    }

    setCreating(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await fetch('/api/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...createForm,
          audienceRoles: ['student', 'faculty', 'admin'], // default audience
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create notice');
      }

      setShowCreateModal(false);
      setCreateForm({
        title: '',
        body: '',
        category: 'General',
        priority: 'Medium',
      });
      alert('Announcement notice published successfully!');
      loadNotices();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const resolvedNotices = useMemo(() => {
    if (!query) {
      return notices;
    }

    const normalized = query.toLowerCase();
    return notices.filter((notice) =>
      `${notice.title} ${notice.body}`.toLowerCase().includes(normalized),
    );
  }, [notices, query]);

  return (
    <div className="dashboard-view dashboard-notice-view">
      <section className="dashboard-hero dashboard-hero-compact notice-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Notice Board</h1>
          <p>Stay updated with all campus announcements and important notices</p>
        </div>
        {profile?.role && ['faculty', 'admin'].includes(profile.role) ? (
          <button
            type="button"
            className="primary-pill"
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--accent-color, #f05a28)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            + Create Announcement
          </button>
        ) : null}
      </section>

      <section className="notice-filter-card">
        <div className="notice-search">
          <input
            type="search"
            placeholder="Search notices..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="button" className="notice-filter-btn" onClick={() => alert('Filter drawer opened. Options: Date Range, Department, Specific Keywords.')}>
            Filter
          </button>
        </div>
        <div className="notice-filter-tabs">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`notice-filter-pill ${filter === activeFilter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <span>Loading notices...</span>
        </div>
      ) : null}

      <section className="notice-list-board">
        {resolvedNotices.length ? (
          resolvedNotices.map((notice) => (
            <article key={notice._id || notice.id} className="notice-card">
              <div className="notice-dot" aria-hidden="true" />
              <div className="notice-content">
                <div className="notice-title-row">
                  <h3>{notice.title}</h3>
                  <span className={getPriorityLabelClass(notice.priority)}>
                    {notice.priority || 'Medium'} Priority
                  </span>
                </div>
                <p>{notice.body}</p>
                <div className="notice-meta">
                  <span>⏱ {formatRelative(notice.publishAt)}</span>
                  <span>📅 {formatDate(notice.publishAt)}</span>
                  <span className="notice-tag">{notice.category}</span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="notice-empty">
            <strong>No notices match your filters.</strong>
            <span>Try another keyword or category.</span>
          </div>
        )}
      </section>

      {profile?.role && ['faculty', 'admin'].includes(profile.role) ? (
        <p className="notice-role-hint">You can create new notices using the button at the top.</p>
      ) : null}

      {/* CREATE NOTICE MODAL */}
      {showCreateModal ? (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Create Announcement</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#667085' }}
              >
                &times;
              </button>
            </div>

            {createError ? (
              <div style={{ color: '#d92d20', backgroundColor: '#fef3f2', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {createError}
              </div>
            ) : null}

            <form onSubmit={handleCreateSubmit}>
              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="notice-title">Title</label>
                <input
                  id="notice-title"
                  type="text"
                  placeholder="Enter notice title"
                  style={inputStyle}
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="notice-body">Notice Body</label>
                <textarea
                  id="notice-body"
                  placeholder="Enter description detail here..."
                  style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                  value={createForm.body}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, body: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle} htmlFor="notice-category">Category</label>
                  <select
                    id="notice-category"
                    style={inputStyle}
                    value={createForm.category}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="General">General</option>
                    <option value="Exam">Exam</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Event">Event</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle} htmlFor="notice-priority">Priority</label>
                  <select
                    id="notice-priority"
                    style={inputStyle}
                    value={createForm.priority}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '10px 16px', border: '1px solid #d0d5dd', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: '600', color: '#344054' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ padding: '10px 16px', border: 'none', borderRadius: '8px', background: 'var(--accent-color, #f05a28)', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
                >
                  {creating ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
