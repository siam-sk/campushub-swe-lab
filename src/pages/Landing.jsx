import { useNavigate } from 'react-router-dom';

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
];

const stats = [
  { value: '10,000+', label: 'Active Students' },
  { value: '50+', label: 'Universities' },
  { value: '5,000+', label: 'Study Notes' },
  { value: '99%', label: 'Satisfaction' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page" id="top">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">⌂</span>
          <span>CampusHUB</span>
        </div>

        <button className="btn btn-primary btn-small" type="button" onClick={() => navigate('/auth', { state: { mode: 'login' } })}>
          Get Started
        </button>
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
              <button className="btn btn-primary" type="button" onClick={() => navigate('/auth', { state: { mode: 'signup' } })}>
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

          <button className="btn btn-primary" type="button" onClick={() => navigate('/auth', { state: { mode: 'signup' } })}>
            Join CampusHub Now
          </button>
        </section>
      </main>

      <footer className="footer">© 2026 CampusHUB. Built for students, by students.</footer>
    </div>
  );
}