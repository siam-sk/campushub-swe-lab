import { useEffect, useState } from 'react';

const fallbackAlumni = [];

export default function AlumniPage() {
  const [alumni, setAlumni] = useState(fallbackAlumni);

  const getInitials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();

  useEffect(() => {
    const controller = new AbortController();

    const loadAlumni = async () => {
      try {
        const response = await fetch('/api/alumni', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Unable to load alumni');
        }
        const payload = await response.json();
        setAlumni(payload.alumni || fallbackAlumni);
      } catch {
        setAlumni(fallbackAlumni);
      }
    };

    loadAlumni();

    return () => controller.abort();
  }, []);

  const handleRequest = async (alumniId) => {
    if (!alumniId) {
      return;
    }

    await fetch('/api/alumni/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alumniId }),
    });
  };

  return (
    <div className="dashboard-view alumni-view">
      <section className="alumni-hero">
        <span className="feature-pill">New Feature</span>
        <h1>Alumni Network</h1>
        <p>Connect with successful alumni for mentorship and career guidance</p>
      </section>

      <section className="alumni-stats">
        <div className="alumni-stat-card">
          <strong>2,450+</strong>
          <span>Total Alumni</span>
        </div>
        <div className="alumni-stat-card">
          <strong>580</strong>
          <span>Active Mentors</span>
        </div>
        <div className="alumni-stat-card">
          <strong>150+</strong>
          <span>Top Companies</span>
        </div>
        <div className="alumni-stat-card">
          <strong>45</strong>
          <span>Countries</span>
        </div>
      </section>

      <section className="alumni-search">
        <input type="search" placeholder="Search by name, company, or role..." />
        <button type="button">Advanced Filter</button>
        <div className="alumni-filters">
          {['Available for Mentoring', 'Recent Graduates', 'Top Achievers'].map((item) => (
            <button key={item} type="button">{item}</button>
          ))}
        </div>
      </section>

      <section className="alumni-grid">
        {alumni.length ? (
          alumni.map((profile) => (
            <article key={profile._id || profile.name} className="alumni-card">
              <div className="alumni-cover"></div>
              <div className="alumni-body">
                <div className="alumni-avatar">{getInitials(profile.name)}</div>
                <h3>{profile.name}</h3>
                <span>{profile.batch}</span>
                <div className="alumni-meta">
                  <span>{profile.role}</span>
                  <span>{profile.company}</span>
                  <span>{profile.location}</span>
                </div>
                <div className="alumni-tags">
                  {profile.skills?.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
                {profile.highlight ? <p>{profile.highlight}</p> : null}
                <button type="button" className="primary-pill" onClick={() => handleRequest(profile._id)}>
                  Request Mentorship
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">No alumni profiles available yet.</div>
        )}
      </section>
    </div>
  );
}
