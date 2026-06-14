import { useEffect, useState } from 'react';

const fallbackClubs = [];

export default function ClubsPage() {
  const [clubs, setClubs] = useState(fallbackClubs);

  useEffect(() => {
    const controller = new AbortController();

    const loadClubs = async () => {
      try {
        const response = await fetch('/api/clubs', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Unable to load clubs');
        }
        const payload = await response.json();
        setClubs(payload.clubs || fallbackClubs);
      } catch {
        setClubs(fallbackClubs);
      }
    };

    loadClubs();

    return () => controller.abort();
  }, []);

  const handleJoin = async (clubId) => {
    if (!clubId) {
      return;
    }

    await fetch('/api/clubs/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clubId }),
    });
  };

  return (
    <div className="dashboard-view clubs-view">
      <section className="clubs-hero">
        <div>
          <h1>Club Page of United International University</h1>
          <p>Discover clubs, upcoming events, and join the community.</p>
        </div>
        <div className="clubs-actions">
          <button type="button">Events</button>
          <button type="button">Dashboard</button>
          <button type="button">Clubs</button>
          <button type="button">Log Out</button>
        </div>
      </section>

      <section className="clubs-grid">
        {clubs.length ? (
          clubs.map((club) => (
            <article key={club._id || club.name} className="club-card">
              <div
                className="club-cover"
                style={club.coverImage ? { backgroundImage: `url(${club.coverImage})` } : undefined}
              >
                <span className="club-count">{club.memberCount || 0}</span>
              </div>
              <div className="club-body">
                <h3>{club.name}</h3>
                <p>{club.summary}</p>
                <div className="club-meta">
                  <span>Date & Time: {club.date} · {club.time}</span>
                  <span>Venue: {club.venue}</span>
                </div>
                <p>{club.description}</p>
                <button type="button" onClick={() => handleJoin(club._id)}>
                  Join
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">No clubs found yet.</div>
        )}
      </section>
    </div>
  );
}
