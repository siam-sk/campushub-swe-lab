import { useEffect, useState } from 'react';
import { auth } from '../../firebase';

export default function FacultyHome() {
  const [dashboardData, setDashboardData] = useState({
    greetingName: 'Faculty',
    greetingMessage: 'Here is your teaching overview for today',
    stats: [],
    courses: [],
    submissions: [],
    notices: [],
  });
  const [loading, setLoading] = useState(true);

  const getToken = async () => {
    const mockToken = localStorage.getItem('campushub_mock_token');
    if (mockToken) return mockToken;
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      // Fetch user profile
      let userEmail = '';
      const meResponse = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meResponse.ok) {
        const payload = await meResponse.json();
        userEmail = payload.user.email;
      }

      if (!userEmail && auth.currentUser) {
        userEmail = auth.currentUser.email;
      }

      if (userEmail) {
        const response = await fetch(`/api/dashboard/home?email=${encodeURIComponent(userEmail)}`);
        if (response.ok) {
          const payload = await response.json();
          if (payload.page) {
            setDashboardData(payload.page);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadData();
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="dashboard-view dashboard-home-view">
      <section className="dashboard-hero">
        <div>
          <h1>Good Morning, {dashboardData.greetingName}! 👋</h1>
          <p>{dashboardData.greetingMessage}</p>
        </div>
      </section>

      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <span>Loading your dashboard...</span>
        </div>
      ) : null}

      {!loading && dashboardData.stats && dashboardData.stats.length > 0 && (
        <section className="stats-grid" aria-label="Dashboard summary">
          {dashboardData.stats.map((stat) => (
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
              <h2>My Teaching Courses</h2>
            </div>

            <div className="course-list">
              {dashboardData.courses && dashboardData.courses.length > 0 ? (
                dashboardData.courses.map((course) => (
                  <article key={course.id} className={`course-card accent-${course.accent || 'blue'}`}>
                    <div className="course-head">
                      <div>
                        <h3>{course.title}</h3>
                        <p>{course.code}</p>
                      </div>
                      <span>{course.students} Enrolled</span>
                    </div>

                    <div className="course-meta">⏰ {course.footer || 'No schedule set'}</div>
                  </article>
                ))
              ) : (
                <p style={{ padding: '16px', color: '#667085' }}>No teaching courses found.</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Recent Submissions</h2>
            </div>

            <div className="event-list">
              {dashboardData.submissions && dashboardData.submissions.length > 0 ? (
                dashboardData.submissions.map((sub) => (
                  <article key={sub.id} className={`event-card accent-blue`}>
                    <div style={{ flex: 1 }}>
                      <h3>{sub.studentName}</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85em', color: '#667085' }}>
                        {sub.assignmentTitle} ({sub.courseCode})
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8em', color: '#98a2b3' }}>
                        Submitted: {new Date(sub.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`event-pill ${sub.graded ? 'success' : 'warning'}`}>
                      {sub.graded ? `Graded (${sub.marks})` : 'Pending'}
                    </span>
                  </article>
                ))
              ) : (
                <p style={{ padding: '16px', color: '#667085' }}>No recent submissions.</p>
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
              {dashboardData.notices && dashboardData.notices.length > 0 ? (
                dashboardData.notices.map((notice) => (
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
                <p style={{ padding: '16px', color: '#667085' }}>No recent notices.</p>
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
              <button type="button" className="quick-action primary" onClick={() => window.location.href='/dashboard/notice-board'}>
                Post Notice
              </button>
              <button type="button" className="quick-action" onClick={() => window.location.href='/dashboard/courses'}>
                Update Syllabus
              </button>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
