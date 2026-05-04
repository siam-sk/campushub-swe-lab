import { useState } from 'react'
import './App.css'

const dashboardStats = [
  { title: 'My Courses', value: '6', note: '+2 this semester', icon: '📘', accent: 'blue' },
  { title: 'New Notices', value: '5', note: '3 unread', icon: '🔔', accent: 'orange' },
  { title: 'Messages', value: '12', note: '3 new', icon: '💬', accent: 'green' },
  { title: 'GPA', value: '3.75', note: '↑ 0.15', icon: '📈', accent: 'purple' },
]

const sidebarItems = [
  { label: 'Dashboard', active: true },
  { label: 'Notice Board', badge: '5' },
  { label: 'Notes Library' },
  { label: 'Messages', badge: '3' },
  { label: 'Community' },
  { label: 'Profile' },
  { label: 'Club' },
  { label: 'Premium' },
]

const featureTools = ['Job Board', 'Mock Tests', 'Live Classes', 'AI Assistant']

const courses = [
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
]

const notices = [
  { title: 'Holiday Notice', time: '2 hours ago', label: 'Holiday' },
  { title: 'Exam Schedule Updated', time: '5 hours ago', label: 'Exam' },
  { title: 'Library Timing Change', time: '1 day ago', label: 'General' },
]

const events = [
  { title: 'Mid-term Examination', date: 'Jan 15, 2026', type: 'Exam', accent: 'red' },
  { title: 'Tech Fest 2026', date: 'Jan 20, 2026', type: 'Event', accent: 'orange' },
  { title: 'Project Submission', date: 'Jan 25, 2026', type: 'Deadline', accent: 'yellow' },
]

const features = [
  {
    title: 'Notes Repository',
    text: 'Access and share high-quality notes from your peers. Organized by subject, semester, and topic.',
    icon: '📄',
  },
  {
    title: 'Notice Board',
    text: 'Never miss important announcements. Get instant notifications about exams, events, and deadlines.',
    icon: '🔔',
  },
  {
    title: 'Real-time Chat',
    text: 'Connect with classmates and faculty. Create study groups and collaborate in real-time.',
    icon: '💬',
  },
  {
    title: 'Community',
    text: 'Join clubs, societies, and interest groups. Build your campus network effortlessly.',
    icon: '👥',
  },
  {
    title: 'Course Dashboard',
    text: 'Track your courses, assignments, and grades all in one unified dashboard.',
    icon: '📚',
  },
  {
    title: 'Academic Tools',
    text: 'GPA calculator, timetable planner, and other essential tools for students.',
    icon: '🎓',
  },
]

const stats = [
  { value: '10,000+', label: 'Active Students' },
  { value: '50+', label: 'Universities' },
  { value: '5,000+', label: 'Study Notes' },
  { value: '99%', label: 'Satisfaction' },
]

function App() {
  const [screen, setScreen] = useState('landing')

  if (screen === 'dashboard') {
    return (
      <div className="dashboard-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <span className="brand-mark">⌂</span>
            <span>CampusHUB</span>
          </div>

          <nav className="sidebar-nav" aria-label="Primary">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`sidebar-item ${item.active ? 'active' : ''}`}
              >
                <span>{item.label}</span>
                {item.badge ? <span className="sidebar-badge">{item.badge}</span> : null}
              </button>
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

          <button type="button" className="profile-card" onClick={() => setScreen('landing')}>
            <span className="profile-avatar">JS</span>
            <span>
              <strong>John Student</strong>
              <small>CSE, 3rd Year</small>
            </span>
          </button>
        </aside>

        <main className="dashboard-main">
          <section className="dashboard-hero">
            <div>
              <h1>Good Morning, John! 👋</h1>
              <p>Here&apos;s what&apos;s happening with your studies today</p>
            </div>
          </section>

          <section className="stats-grid" aria-label="Dashboard summary">
            {dashboardStats.map((stat) => (
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
                  {courses.map((course) => (
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
                  {events.map((event) => (
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
                  {notices.map((notice) => (
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

                <a className="panel-button" href="#join">
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
        </main>
      </div>
    )
  }

  return (
    <div className="landing-page" id="top">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">⌂</span>
          <span>CampusHUB</span>
        </div>

        <a className="btn btn-primary btn-small" href="#join">
          Get Started
        </a>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">Academic Networking Platform</span>
            <h1>
              Connect. Learn.
              <span>Grow Together.</span>
            </h1>
            <p className="hero-text">
              Your all-in-one platform for academic collaboration, notes sharing, and campus
              networking designed for university students.
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary" type="button" onClick={() => setScreen('dashboard')}>
                Join Community
              </button>
              <a className="btn btn-outline" href="#features">
                Learn More
              </a>
            </div>
          </div>

          <div className="hero-card" aria-label="CampusHub platform highlights">
            <div className="hero-card-top">
              <span className="hero-card-icon">🎓</span>
              <div>
                <strong>10,000+ Students</strong>
                <p>Connecting across campuses</p>
              </div>
            </div>

            <div className="hero-card-grid">
              <div className="mini-card">
                <span>📘</span>
                <strong>5K+ Notes</strong>
              </div>
              <div className="mini-card">
                <span>🔔</span>
                <strong>Live Updates</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <h2>Everything You Need in One Place</h2>
            <p>Powerful features to enhance your academic journey</p>
          </div>

          <div className="features-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon" aria-hidden="true">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="stats-band" aria-label="CampusHub statistics">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-item">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>

        <section className="cta-section" id="join">
          <div className="section-heading compact">
            <h2>Ready to Join the Community?</h2>
            <p>
              Start connecting with thousands of students and enhance your academic experience
              today.
            </p>
          </div>

          <button className="btn btn-primary" type="button" onClick={() => setScreen('dashboard')}>
            Join CampusHub Now
          </button>
        </section>
      </main>

      <footer className="footer">© 2026 CampusHUB. Built for students, by students.</footer>
    </div>
  )
}

export default App
