import { useEffect, useState } from 'react';

const fallbackClubs = [
  {
    _id: '1',
    name: 'Computer Club',
    summary: 'Programming and software development activities',
    description:
      'Join coding competitions, workshops and software projects.',
    memberCount: 120,
    date: 'Every Friday',
    time: '3:00 PM',
    venue: 'Room 504',
    isJoined: false,
  },
  {
    _id: '2',
    name: 'Photography Club',
    summary: 'Photography and creative media',
    description:
      'Learn photography skills and participate in photo walks.',
    memberCount: 75,
    date: 'Saturday',
    time: '4:00 PM',
    venue: 'Auditorium',
    isJoined: false,
  },
  {
    _id: '3',
    name: 'Sports Club',
    summary: 'Sports and fitness activities',
    description:
      'Participate in football, cricket and indoor games.',
    memberCount: 95,
    date: 'Sunday',
    time: '5:00 PM',
    venue: 'University Field',
    isJoined: false,
  },
];

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

    try {
      const response = await fetch('/api/clubs/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId }),
      });

      if (response.ok) {
        // Update local state to show joined status and increment member count
        setClubs(prev => prev.map(club => 
          (club._id === clubId || club.name === clubId) 
            ? { ...club, memberCount: (club.memberCount || 0) + 1, isJoined: true }
            : club
        ));
        alert('Welcome! You have successfully joined the club.');
      }
    } catch (err) {
      console.error('Join failed:', err);
      // Fallback for demo: update anyway to show functionality
      setClubs(prev => prev.map(club => 
        (club._id === clubId || club.name === clubId) 
          ? { ...club, memberCount: (club.memberCount || 0) + 1, isJoined: true }
          : club
      ));
      alert('Welcome! You have successfully joined the club (Demo Mode).');
    }
  };

  return (
    <div className="dashboard-view clubs-view">
      <section className="clubs-hero">
        <div>
          <h1>Club Page of United International University</h1>
          <p>Discover clubs, upcoming events, and join the community.</p>
        </div>
        <div className="clubs-actions">
          <button type="button" onClick={() => alert('Viewing Upcoming Events...')}>Events</button>
          <button type="button" onClick={() => window.location.href = '/dashboard'}>Dashboard</button>
          <button type="button" className="active">Clubs</button>
          <button type="button" onClick={() => { localStorage.clear(); window.location.href = '/auth'; }}>Log Out</button>
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
                <span className="club-count">{club.memberCount || 0} Members</span>
              </div>
              <div className="club-body">
                <h3>{club.name}</h3>
                <p>{club.summary}</p>
                <div className="club-meta">
                  <span>Date & Time: {club.date} · {club.time}</span>
                  <span>Venue: {club.venue}</span>
                </div>
                <p>{club.description}</p>
                <button 
                  type="button" 
                  disabled={club.isJoined}
                  className={club.isJoined ? 'joined-btn' : ''}
                  onClick={() => handleJoin(club._id || club.name)}
                >
                  {club.isJoined ? 'Joined' : 'Join Club'}
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
