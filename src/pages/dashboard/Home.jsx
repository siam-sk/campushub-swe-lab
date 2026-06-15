import { useEffect, useState } from 'react';
import { auth } from '../../firebase';

export default function DashboardHome() {
  const [homeData, setHomeData] = useState({
    greetingName: 'Student',
    greetingMessage: "Here's what's happening with your studies today",
    stats: [],
    courses: [],
    notices: [],
    events: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const loadHome = async () => {
      try {
        if (!auth.currentUser) {
          setLoading(false);
          return;
        }

        const userEmail = auth.currentUser.email;
        const response = await fetch(`/api/dashboard/home?email=${encodeURIComponent(userEmail)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const payload = await response.json();
        if (payload.page) {
          setHomeData(payload.page);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadHome();

    return () => controller.abort();
  }, []);

  return (
    <div className="dashboard-view dashboard-home-view">
      <section className="dashboard-hero">
        <div>
          <h1>Good Morning, {homeData.greetingName}! 👋</h1>
          <p>{homeData.greetingMessage}</p>
        </div>
      </section>

      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <span>Loading your dashboard...</span>
        </div>
      ) : null}

      {!loading && homeData.stats.length > 0 && (
        <section className="stats-grid" aria-label="Dashboard summary">
          {homeData.stats.map((stat) => (
            <article key={stat.title} className={`stat-card accent-${stat.accent}`}>
              <div className="stat-icon">{stat.icon}</div>
              <div>
                <strong>{stat.value}</strong>
                <span>{stat.title}</span>
                <small>{stat.note}</small>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="dashboard-grid">
        <div className="dashboard-column dashboard-column-main">
          <section className="panel">
            <div className="panel-header">
              <h2>My Courses</h2>
            </div>

            <div className="course-list">
              {homeData.courses && homeData.courses.length > 0 ? (
                homeData.courses.map((course) => (
                  <article key={course.code} className={`course-card accent-${course.accent}`}>
                    <div className="course-head">
                      <div>
                        <h3>{course.name}</h3>
                        <p>{course.code}</p>
                      </div>
                      <span>{course.progress}%</span>
                    </div>

                    <div className="progress-label">
                      <span>Progress</span>
                    </div>

                    <div className="progress-track">
                      <span style={{ width: `${course.progress}%` }} />
                    </div>

                    <div className="course-meta">⏰ {course.schedule}</div>
                  </article>
                ))
              ) : (
                <p style={{ padding: '16px', color: '#667085' }}>No enrolled courses found.</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Upcoming Events</h2>
            </div>

            <div className="event-list">
              {homeData.events && homeData.events.length > 0 ? (
                homeData.events.map((event) => (
                  <article key={event.title} className={`event-card accent-${event.accent}`}>
                    <div>
                      <h3>{event.title}</h3>
                      <p>{event.date}</p>
                    </div>
                    <span className="event-pill">{event.type}</span>
                  </article>
                ))
              ) : (
                <p style={{ padding: '16px', color: '#667085' }}>No upcoming events.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="dashboard-column dashboard-column-side">
          <section className="panel">
            <div className="panel-header">
              <h2>Recent Notices</h2>
            </div>

            <div className="notice-list">
              {homeData.notices && homeData.notices.length > 0 ? (
                homeData.notices.map((notice) => (
                  <article key={notice.title} className="notice-item">
                    <div className="notice-mark" />
                    <div>
                      <h3>{notice.title}</h3>
                      <p>
                        {notice.time} · <span>{notice.label}</span>
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <p style={{ padding: '16px', color: '#667085' }}>No new notices.</p>
              )}
            </div>

            <a className="panel-button" href="/dashboard/notice-board">
              View All Notices
            </a>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Quick Actions</h2>
            </div>

            <div className="quick-actions">
              <button type="button" className="quick-action primary" onClick={() => window.location.href='/dashboard/notes-library'}>
                Upload Notes
              </button>
              <button type="button" className="quick-action" onClick={() => window.location.href='/dashboard/courses'}>
                View Timetable
              </button>
              <button type="button" className="quick-action" onClick={() => window.location.href='/dashboard/club'}>
                Join Study Group
              </button>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}