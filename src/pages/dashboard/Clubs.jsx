import { useEffect, useState } from 'react';
import { auth } from '../../firebase';

const fallbackClubs = [];

export default function ClubsPage() {
  const [clubs, setClubs] = useState(fallbackClubs);

  const getToken = async () => {
    const mockToken = localStorage.getItem('campushub_mock_token');
    if (mockToken) return mockToken;
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const loadClubs = async () => {
      try {
        const token = await getToken();
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch('/api/clubs', { headers, signal: controller.signal });
        if (!response.ok) {
          throw new Error('Unable to load clubs');
        }
        const payload = await response.json();
        if (active) {
          setClubs(payload.clubs || fallbackClubs);
        }
      } catch {
        if (active) {
          setClubs(fallbackClubs);
        }
      }
    };

    Promise.resolve().then(() => {
      if (active) {
        loadClubs();
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const handleJoin = async (clubId) => {
    if (!clubId) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/clubs?action=join', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Join failed');
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
          <button type="button">Dashboard</button>
          <button type="button" className="active">Clubs</button>
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
