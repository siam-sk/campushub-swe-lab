import { useEffect, useMemo, useState } from 'react';

const fallbackClasses = [];

export default function LiveClassesPage() {
  const [classes, setClasses] = useState(fallbackClasses);

  useEffect(() => {
    const controller = new AbortController();

    const loadClasses = async () => {
      try {
        const response = await fetch('/api/live-classes', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Unable to load classes');
        }
        const payload = await response.json();
        setClasses(payload.classes || fallbackClasses);
      } catch {
        setClasses(fallbackClasses);
      }
    };

    loadClasses();

    return () => controller.abort();
  }, []);

  const liveNow = useMemo(() => classes.find((item) => item.status === 'live'), [classes]);
  const upcoming = useMemo(() => classes.filter((item) => item.status !== 'live'), [classes]);

  const handleJoin = async (classId) => {
    if (!classId) {
      return;
    }

    await fetch('/api/live-classes/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId }),
    });
  };

  return (
    <div className="dashboard-view live-classes-view">
      <section className="live-classes-hero">
        <span className="feature-pill">New Feature - WebRTC Live Classes</span>
        <h1>Live Classes</h1>
        <p>Join interactive sessions with expert instructors</p>
      </section>

      <section className="live-now">
        <h2>Live Now</h2>
        {liveNow ? (
          <article className="live-card">
            <div className="live-cover">
              <span className="live-pill">Live</span>
            </div>
            <div className="live-body">
              <h3>{liveNow.title}</h3>
              <span>{liveNow.instructor}</span>
              <div className="live-meta">
                <span>{liveNow.durationMinutes} min</span>
                <span>{liveNow.attendees}/{liveNow.capacity}</span>
              </div>
            </div>
            <button type="button" className="primary-pill" onClick={() => handleJoin(liveNow._id)}>
              Join Now
            </button>
          </article>
        ) : (
          <div className="live-empty">No live classes at the moment.</div>
        )}
      </section>

      <section className="upcoming-classes">
        <h2>Upcoming Classes</h2>
        <div className="upcoming-grid">
          {upcoming.length ? (
            upcoming.map((item) => (
              <article key={item._id || item.title} className="upcoming-card">
                <div className="upcoming-cover"></div>
                <h3>{item.title}</h3>
                <span>{item.instructor}</span>
                <small>{item.durationMinutes} min</small>
              </article>
            ))
          ) : (
            <div className="empty-state">No upcoming classes scheduled yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
