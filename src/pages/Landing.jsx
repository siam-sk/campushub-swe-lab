import { useNavigate } from 'react-router-dom';

const features = [
  {
    title: 'Notes Repository',
    text: 'Access and share high-quality notes from your peers. Organized by subject, semester, and topic.',
    icon: 'NR',
  },
  {
    title: 'Notice Board',
    text: 'Never miss important announcements. Get instant notifications about exams, events, and deadlines.',
    icon: 'NB',
  },
  {
    title: 'Real-time Chat',
    text: 'Connect with classmates and faculty. Create study groups and collaborate in real-time.',
    icon: 'RC',
  },
  {
    title: 'Community',
    text: 'Join clubs, societies, and interest groups. Build your campus network effortlessly.',
    icon: 'CM',
  },
  {
    title: 'Course Dashboard',
    text: 'Track your courses, assignments, and grades all in one unified dashboard.',
    icon: 'CD',
  },
  {
    title: 'Academic Tools',
    text: 'GPA calculator, timetable planner, and other essential tools for students.',
    icon: 'AT',
  },
];

const differentiators = [
  {
    title: 'Premium Study Materials',
    text: 'Access to 1000+ expert-curated notes, past papers, and solved assignments across all subjects.',
    icon: 'SM',
  },
  {
    title: 'Live Classes & Webinars',
    text: 'Attend live sessions with industry experts and top-performing students for real-time learning.',
    icon: 'LC',
  },
  {
    title: '1-on-1 Mentorship',
    text: 'Get personalized guidance from seniors and professionals to excel in your academic journey.',
    icon: 'MN',
  },
  {
    title: 'Job & Internship Board',
    text: 'Exclusive access to campus placements, internships, and freelancing opportunities.',
    icon: 'JB',
  },
  {
    title: 'Certification Courses',
    text: 'Earn industry-recognized certificates in Web Dev, AI/ML, Data Science, and more.',
    icon: 'CC',
  },
  {
    title: 'Mock Tests & Analytics',
    text: 'Practice with subject-wise mock tests and get detailed performance analytics.',
    icon: 'MT',
  },
  {
    title: 'Assignment Help',
    text: 'Get your assignments reviewed and improved by subject matter experts.',
    icon: 'AH',
  },
  {
    title: 'Career Counseling',
    text: 'Professional career guidance to help you choose the right path after graduation.',
    icon: 'CC',
  },
  {
    title: 'Skill Development',
    text: 'Master in-demand skills through curated learning paths and projects.',
    icon: 'SD',
  },
];

const earnOptions = [
  { title: 'Upload Notes', text: 'Earn BDT 50-500 per note download', icon: 'UN' },
  { title: 'Tutor Students', text: 'Earn BDT 500-2000 per hour', icon: 'TS' },
  { title: 'Create Courses', text: 'Earn passive income from course sales', icon: 'CC' },
  { title: 'Referral Program', text: 'Earn BDT 200 per successful referral', icon: 'RP' },
];

const comingSoon = [
  {
    title: 'AI Study Assistant',
    text: 'Get instant answers to your doubts with our AI-powered chatbot trained on academic content.',
    badge: 'In Development',
  },
  {
    title: 'Virtual Study Rooms',
    text: 'Collaborate with peers in virtual study rooms with video, whiteboard, and screen sharing.',
    badge: 'Q2 2026',
  },
  {
    title: 'Scholarship Portal',
    text: 'Find and apply for scholarships, grants, and financial aid opportunities.',
    badge: 'Q2 2026',
  },
  {
    title: 'Alumni Network',
    text: 'Connect with alumni for career guidance, networking, and job referrals.',
    badge: 'Q3 2026',
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
              <span className="hero-card-icon">CH</span>
              <div>
                <strong>10,000+ Students</strong>
                <p>Connecting across campuses</p>
              </div>
            </div>

            <div className="hero-card-grid">
              <div className="mini-card">
                <span>NL</span>
                <strong>5K+ Notes</strong>
              </div>
              <div className="mini-card">
                <span>NU</span>
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

        <section className="landing-section">
          <div className="section-heading">
            <h2>What Makes Us Different</h2>
          </div>

          <div className="features-grid landing-grid-3">
            {differentiators.map((item) => (
              <article className="feature-card" key={item.title}>
                <div className="feature-icon" aria-hidden="true">
                  {item.icon}
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="earning-section">
          <div className="section-heading compact">
            <h2>Earn While You Learn</h2>
            <p>Turn your knowledge into income with our creator program</p>
          </div>

          <div className="earning-grid">
            {earnOptions.map((item) => (
              <article key={item.title} className="earning-card">
                <div className="earning-icon">{item.icon}</div>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </article>
            ))}
          </div>

          <button className="btn btn-primary" type="button" onClick={() => navigate('/auth', { state: { mode: 'signup' } })}>
            Start Earning Today
          </button>
        </section>

        <section className="landing-section">
          <div className="section-heading">
            <h2>Coming Soon</h2>
          </div>

          <div className="coming-grid">
            {comingSoon.map((item) => (
              <article key={item.title} className="coming-card">
                <div className="coming-head">
                  <h3>{item.title}</h3>
                  <span className="coming-badge">{item.badge}</span>
                </div>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
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