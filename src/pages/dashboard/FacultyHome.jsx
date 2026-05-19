import { useEffect, useState } from 'react';
import { auth } from '../../firebase';

const fallbackHome = {
  greetingName: 'Faculty',
  greetingMessage: 'Here is your teaching overview for today',
  stats: [
    { title: 'Total Students', value: '145', note: 'Across 3 courses', icon: '👥', accent: 'blue' },
    { title: 'Upcoming Lectures', value: '2', note: 'Next: CSE 201', icon: '📅', accent: 'orange' },
    { title: 'Unread Messages', value: '4', note: 'From students', icon: '💬', accent: 'green' },
    { title: 'Assignments', value: '12', note: 'To review', icon: '📝', accent: 'purple' },
  ],
  courses: [
    {
      name: 'Data Structures & Algorithms',
      code: 'CSE 201',
      students: 55,
      schedule: 'Today, 2:00 PM',
      accent: 'blue',
    },
    {
      name: 'Database Management Systems',
      code: 'CSE 301',
      students: 45,
      schedule: 'Tomorrow, 10:00 AM',
      accent: 'green',
    },
    {
      name: 'Software Engineering',
      code: 'CSE 401',
      students: 45,
      schedule: 'Wednesday, 11:00 AM',
      accent: 'purple',
    },
  ],
  notices: [
    { title: 'Faculty Meeting', time: '2 hours ago', label: 'Urgent' },
    { title: 'Syllabus Update Deadline', time: '1 day ago', label: 'Academic' },
  ],
  events: [
    { title: 'Mid-term Examination Duty', date: 'Jan 15, 2026', type: 'Exam Duty', accent: 'red' },
    { title: 'Tech Fest 2026 Panelist', date: 'Jan 20, 2026', type: 'Event', accent: 'orange' },
  ],
};

export default function FacultyHome() {
  const [homeData, setHomeData] = useState(fallbackHome);
  const [loading, setLoading] = useState(false); // Can be replaced by real API fetch

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
              <h2>My Teaching Courses</h2>
            </div>

            <div className="course-list">
              {homeData.courses.map((course) => (
                <article key={course.code} className={`course-card accent-${course.accent}`}>
                  <div className="course-head">
                    <div>
                      <h3>{course.name}</h3>
                      <p>{course.code}</p>
                    </div>
                    <span>{course.students} Enrolled</span>
                  </div>

                  <div className="course-meta">⏰ {course.schedule}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Upcoming Schedule</h2>
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
              <h2>Faculty Notices</h2>
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
                Post Notice
              </button>
              <button type="button" className="quick-action">
                Update Syllabus
              </button>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
