import { useEffect, useState } from 'react';

const fallbackProfile = {
  tabs: [
    'Student Accounts',
    'Transport Registration',
    'Admin Control',
    'Scheduler',
    'Result',
    'Registration',
  ],
  stats: {
    cgpa: 3.44,
    completedCredits: 70,
    balance: 0,
  },
  advisor: {
    name: 'Akbor Ali',
    initials: 'AKI',
    email: 'sjsakjd@cse.uiu.ac.bd',
    room: '123 (D)',
    phone: 'xxxxxxxxxxxx',
  },
  resultSummary: {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'],
    scores: [2.8, 3.0, 3.2, 3.1, 3.4],
  },
  attendanceSummary: {
    label: 'No attendance data available',
  },
  profileInfo: {
    fullName: 'John Smith',
    studentId: '01122XXXX',
    dob: '01 September, 2000',
    phone: '017XXXXXXXXXX',
  },
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(fallbackProfile);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Unable to load profile');
        }
        const payload = await response.json();
        setProfile(payload.profile || fallbackProfile);
      } catch {
        setProfile(fallbackProfile);
      }
    };

    loadProfile();

    return () => controller.abort();
  }, []);

  return (
    <div className="dashboard-view profile-view">
      <section className="profile-hero">
        <h1>My Profile</h1>
        <div className="profile-tabs">
          {profile.tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`profile-tab ${tab === profile.tabs[0] ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      <section className="profile-stats">
        <article className="profile-stat-card profile-stat-orange">
          <span>Transcript CGPA:</span>
          <strong>{profile.stats.cgpa.toFixed(2)}</strong>
          <small>Completed Credit: {profile.stats.completedCredits}</small>
        </article>
        <article className="profile-stat-card profile-stat-orange">
          <span>Current Balance:</span>
          <strong>{profile.stats.balance.toFixed(2)}</strong>
          <small>Negative (-) balance means advance payment</small>
        </article>
        <article className="profile-stat-card profile-stat-red">
          <span>For online payment</span>
          <button type="button" className="profile-action">Click Here</button>
        </article>
      </section>

      <section className="profile-grid">
        <article className="profile-panel">
          <h2>Advisor Information:</h2>
          <div className="profile-info-row">
            <span>Advisor Name</span>
            <strong>{profile.advisor.name}</strong>
          </div>
          <div className="profile-info-row">
            <span>Advisor Initial</span>
            <strong>{profile.advisor.initials}</strong>
          </div>
          <div className="profile-info-row">
            <span>Email Address</span>
            <strong>{profile.advisor.email}</strong>
          </div>
          <div className="profile-info-row">
            <span>Room No</span>
            <strong>{profile.advisor.room}</strong>
          </div>
          <div className="profile-info-row">
            <span>Contact Number</span>
            <strong>{profile.advisor.phone}</strong>
          </div>
        </article>

        <article className="profile-panel">
          <h2>Result Summary:</h2>
          <div className="profile-chart">
            {profile.resultSummary.scores.map((score, index) => (
              <div key={`${score}-${index}`} className="profile-chart-point">
                <div style={{ height: `${score * 18}px` }} />
                <span>{profile.resultSummary.labels[index]}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="profile-panel">
          <h2>Profile Information:</h2>
          <div className="profile-info-card">
            <div className="profile-avatar">JS</div>
            <div>
              <strong>{profile.profileInfo.fullName}</strong>
              <span>{profile.profileInfo.studentId}</span>
              <small>DOB</small>
              <p>{profile.profileInfo.dob}</p>
              <small>Phone</small>
              <p>{profile.profileInfo.phone}</p>
            </div>
          </div>
        </article>

        <article className="profile-panel">
          <h2>Attendance Summary:</h2>
          <div className="profile-attendance">
            <div className="attendance-icon"></div>
            <span>{profile.attendanceSummary.label}</span>
          </div>
        </article>
      </section>
    </div>
  );
}
