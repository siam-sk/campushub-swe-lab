const categories = [
  { name: 'All Subjects', count: 245, color: 'orange' },
  { name: 'Data Structures', count: 56, color: 'blue' },
  { name: 'Database Systems', count: 42, color: 'green' },
  { name: 'Operating Systems', count: 38, color: 'purple' },
  { name: 'Computer Networks', count: 45, color: 'orange' },
  { name: 'Web Development', count: 64, color: 'teal' },
];

const notes = [
  {
    id: 'note-1',
    title: 'Data Structures & Algorithms',
    code: 'CSE 201',
    topic: 'Binary Trees & BST',
    pages: 15,
    author: 'Sarah Johnson',
    date: '02/01/2026',
    downloads: 245,
    rating: 4.8,
    accent: 'blue',
  },
  {
    id: 'note-2',
    title: 'Database Management Systems',
    code: 'CSE 301',
    topic: 'SQL Queries & Joins - Advanced',
    pages: 22,
    author: 'Michael Chen',
    date: '01/01/2026',
    downloads: 189,
    rating: 4.6,
    premium: true,
    price: 199,
    accent: 'green',
  },
  {
    id: 'note-3',
    title: 'Operating Systems',
    code: 'CSE 302',
    topic: 'Process Scheduling Notes',
    pages: 18,
    author: 'Emma Wilson',
    date: '01/18/2026',
    downloads: 132,
    rating: 4.4,
    accent: 'purple',
  },
  {
    id: 'note-4',
    title: 'Computer Networks',
    code: 'CSE 303',
    topic: 'OSI Model + TCP/IP',
    pages: 21,
    author: 'David Williar',
    date: '01/12/2026',
    downloads: 201,
    rating: 4.5,
    premium: true,
    price: 199,
    accent: 'orange',
  },
];

const accentClassMap = {
  blue: 'note-accent-blue',
  green: 'note-accent-green',
  purple: 'note-accent-purple',
  orange: 'note-accent-orange',
  teal: 'note-accent-teal',
};

export default function NotesLibrary() {
  return (
    <div className="dashboard-view notes-library-view">
      <section className="notes-header">
        <div>
          <h1>Notes Library</h1>
          <p>Access high-quality study materials shared by your peers</p>
        </div>
        <button type="button" className="notes-upload">Upload Notes</button>
      </section>

      <section className="notes-premium">
        <div className="notes-premium-copy">
          <span className="notes-premium-icon">👑</span>
          <div>
            <strong>Unlock Premium Notes</strong>
            <p>Get access to expert-curated study materials and ace your exams!</p>
          </div>
        </div>
        <button type="button" className="notes-premium-btn">Subscribe Now</button>
      </section>

      <section className="notes-search-row">
        <div className="notes-search">
          <span aria-hidden="true">🔍</span>
          <input type="search" placeholder="Search by subject, topic, or keyword..." />
        </div>
        <button type="button" className="notes-filter">Advanced Filter</button>
      </section>

      <section className="notes-library-grid">
        <aside className="notes-categories">
          <div className="notes-card">
            <h2>Categories</h2>
            <div className="notes-category-list">
              {categories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  className={`notes-category ${category.name === 'All Subjects' ? 'active' : ''}`}
                >
                  <span className={`category-dot ${accentClassMap[category.color] || ''}`} />
                  <span>{category.name}</span>
                  <span className="category-count">{category.count}</span>
                </button>
              ))}
            </div>
            <div className="notes-category-summary">
              <div>
                <span>Total Notes</span>
                <strong>245</strong>
              </div>
              <div>
                <span>Premium Notes</span>
                <strong className="premium-count">89</strong>
              </div>
            </div>
          </div>
        </aside>

        <div className="notes-grid">
          <div className="notes-grid-header">
            <span>Showing 6 notes</span>
            <div className="notes-grid-pill">Popular</div>
          </div>

          <div className="notes-cards">
            {notes.map((note) => (
              <article key={note.id} className={`note-card ${accentClassMap[note.accent] || ''}`}>
                <div className="note-card-head">
                  <div className="note-folder">
                    📁
                  </div>
                  <div>
                    <h3>{note.title}</h3>
                    <span>{note.code}</span>
                  </div>
                  <button type="button" className="note-favorite" aria-label="Favorite note">
                    ☆
                  </button>
                </div>

                <div className="note-card-body">
                  <strong>{note.topic}</strong>
                  <span>{note.pages} pages</span>
                </div>

                <div className="note-card-meta">
                  <span>By {note.author}</span>
                  <span>•</span>
                  <span>{note.date}</span>
                </div>

                <div className="note-card-stats">
                  <span>⬇ {note.downloads}</span>
                  <span>★ {note.rating}</span>
                  {note.premium ? (
                    <span className="note-price">BDT {note.price}</span>
                  ) : null}
                </div>

                <div className="note-actions">
                  <button type="button" className="note-action outline">
                    Preview
                  </button>
                  <button type="button" className="note-action primary">
                    {note.premium ? `Unlock Now - BDT ${note.price}` : 'Download'}
                  </button>
                </div>

                {note.premium ? <span className="note-premium">Premium</span> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
