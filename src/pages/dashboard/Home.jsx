import { useEffect, useState } from 'react';
import { auth } from '../../firebase';

const fallbackHome = {
  greetingName: 'Student',
  greetingMessage: "Here's what's happening with your studies today",
  stats: [
    { title: 'My Courses', value: '6', note: '+2 this semester', icon: '📘', accent: 'blue' },
    { title: 'New Notices', value: '5', note: '3 unread', icon: '🔔', accent: 'orange' },
    { title: 'Messages', value: '12', note: '3 new', icon: '💬', accent: 'green' },
    { title: 'GPA', value: '3.75', note: '↑ 0.15', icon: '📈', accent: 'purple' },
  ],
  courses: [
    {
      name: 'Data Structures & Algorithms',
      code: 'CSE 201',
      progress: 75,
      schedule: 'Today, 2:00 PM',
      accent: 'blue',
    },
    {
      name: 'Database Management Systems',
      code: 'CSE 301',
      progress: 60,
      schedule: 'Tomorrow, 10:00 AM',
      accent: 'green',
    },
    {
      name: 'Operating Systems',
      code: 'CSE 302',
      progress: 45,
      schedule: 'Wednesday, 11:00 AM',
      accent: 'purple',
    },
  ],
  notices: [
    { title: 'Holiday Notice', time: '2 hours ago', label: 'Holiday' },
    { title: 'Exam Schedule Updated', time: '5 hours ago', label: 'Exam' },
    { title: 'Library Timing Change', time: '1 day ago', label: 'General' },
  ],
  events: [
    { title: 'Mid-term Examination', date: 'Jan 15, 2026', type: 'Exam', accent: 'red' },
    { title: 'Tech Fest 2026', date: 'Jan 20, 2026', type: 'Event', accent: 'orange' },
    { title: 'Project Submission', date: 'Jan 25, 2026', type: 'Deadline', accent: 'yellow' },
  ],
};

export default function DashboardHome() {
  const [homeData, setHomeData] = useState(fallbackHome);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    const loadHome = async () => {
      try {
        if (!auth.currentUser) {
          setHomeData(fallbackHome);
          setLoading(false);
          return;
        }

        const userEmail = auth.currentUser.email;
        const response = await fetch(`${apiBaseUrl}/api/dashboard/home?email=${encodeURIComponent(userEmail)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const payload = await response.json();
        setHomeData(payload.page || fallbackHome);
      } catch {
        setHomeData(fallbackHome);
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

      {loading ? <div className="dashboard-loading">Loading dashboard content from MongoDB...</div> : null}

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

      <section className="dashboard-grid">
        <div className="dashboard-column dashboard-column-main">
          <section className="panel">
            <div className="panel-header">
              <h2>My Courses</h2>
            </div>

            <div className="course-list">
              {homeData.courses.map((course) => (
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
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Upcoming Events</h2>
            </div>

            <div className="event-list">
              {homeData.events.map((event) => (
                <article key={event.title} className={`event-card accent-${event.accent}`}>
                  <div>
                    <h3>{event.title}</h3>
                    <p>{event.date}</p>
                  </div>
                  <span className="event-pill">{event.type}</span>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="dashboard-column dashboard-column-side">
          <section className="panel">
            <div className="panel-header">
              <h2>Recent Notices</h2>
            </div>

            <div className="notice-list">
              {homeData.notices.map((notice) => (
                <article key={notice.title} className="notice-item">
                  <div className="notice-mark" />
                  <div>
                    <h3>{notice.title}</h3>
                    <p>
                      {notice.time} · <span>{notice.label}</span>
                    </p>
                  </div>
                </article>
              ))}
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
              <button type="button" className="quick-action primary">
                Upload Notes
              </button>
              <button type="button" className="quick-action">
                View Timetable
              </button>
              <button type="button" className="quick-action">
                Join Study Group
              </button>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}