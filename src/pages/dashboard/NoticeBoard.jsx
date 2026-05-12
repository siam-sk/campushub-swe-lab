import { useEffect, useMemo, useState } from 'react';
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

export default function NoticeBoard() {
  const { profile } = useProfile();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [notices, setNotices] = useState(fallbackNotices);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadNotices = async () => {
      if (!auth.currentUser) {
        setNotices(fallbackNotices);
        setLoading(false);
        return;
      }

      try {
        const token = await auth.currentUser.getIdToken();
        const params = new URLSearchParams();
        if (activeFilter && activeFilter !== 'All') {
          params.set('category', activeFilter);
        }
        if (query) {
          params.set('q', query);
        }

        const response = await fetch(`/api/notices?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to load notices');
        }

        const payload = await response.json();
        if (isMounted) {
          setNotices(payload.notices || []);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setNotices(fallbackNotices);
          setLoading(false);
        }
      }
    };

    setLoading(true);
    loadNotices();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activeFilter, query]);

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
      <section className="dashboard-hero dashboard-hero-compact notice-hero">
        <div>
          <h1>Notice Board</h1>
          <p>Stay updated with all campus announcements and important notices</p>
        </div>
      </section>

      <section className="notice-filter-card">
        <div className="notice-search">
          <input
            type="search"
            placeholder="Search notices..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="button" className="notice-filter-btn">
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
        <p className="notice-role-hint">You can create new notices from the admin tools.</p>
      ) : null}
    </div>
  );
}
