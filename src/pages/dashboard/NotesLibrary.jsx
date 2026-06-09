import { useState, useMemo, useEffect } from 'react';
import { auth } from '../../firebase';
import useProfile from '../../hooks/useProfile';

const categories = [
  { name: 'All Subjects', color: 'orange' },
  { name: 'Data Structures', color: 'blue' },
  { name: 'Database Systems', color: 'green' },
  { name: 'Operating Systems', color: 'purple' },
  { name: 'Computer Networks', color: 'orange' },
  { name: 'Web Development', color: 'teal' },
];

const accentClassMap = {
  blue: 'note-accent-blue',
  green: 'note-accent-green',
  purple: 'note-accent-purple',
  orange: 'note-accent-orange',
  teal: 'note-accent-teal',
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
};

const modalContentStyle = {
  backgroundColor: '#ffffff',
  padding: '28px',
  borderRadius: '16px',
  width: '90%',
  maxWidth: '500px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  boxSizing: 'border-box',
};

const formGroupStyle = {
  marginBottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#344054',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const inputStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #d0d5dd',
  fontSize: '15px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
};

export default function NotesLibrary() {
  const { profile } = useProfile();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Subjects');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [uploadForm, setUploadForm] = useState({
    title: '',
    code: '',
    topic: '',
    pages: 1,
    category: 'All Subjects',
  });

  const getToken = async () => {
    const mockToken = localStorage.getItem('campushub_mock_token');
    if (mockToken) return mockToken;
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const loadNotes = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set('q', searchQuery);
      }
      
      const response = await fetch(`/api/notes?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load notes');
      }

      const data = await response.json();
      setNotes(data.notes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [searchQuery]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');

    try {
      const token = await getToken();
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify(uploadForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload note');
      }

      setShowUploadModal(false);
      setUploadForm({
        title: '',
        code: '',
        topic: '',
        pages: 1,
        category: 'All Subjects',
      });
      loadNotes();
    } catch (err) {
      setUploadError(err.message);
    }
  };

  const handleDownload = async (noteId) => {
    try {
      const token = await getToken();
      const response = await fetch('/api/notes?action=download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ noteId }),
      });

      if (!response.ok) {
        throw new Error('Failed to register download');
      }

      const data = await response.json();
      
      // Update locally
      setNotes((prevNotes) =>
        prevNotes.map((n) => (n._id === noteId ? { ...n, downloads: n.downloads + 1 } : n))
      );

      // Open download URL
      window.open(data.downloadUrl, '_blank');
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (noteId) => {
    try {
      const token = await getToken();
      const response = await fetch('/api/notes?action=approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ noteId }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve note');
      }

      loadNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      const token = await getToken();
      const response = await fetch('/api/notes?action=delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ noteId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      loadNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotes = useMemo(() => {
    if (activeCategory === 'All Subjects') return notes;
    return notes.filter((n) => n.category === activeCategory);
  }, [notes, activeCategory]);

  return (
    <div className="dashboard-view notes-library-view">
      <section className="notes-header">
        <div>
          <h1>Notes Library</h1>
          <p>Access high-quality study materials shared by your peers</p>
        </div>
        <button
          type="button"
          className="notes-upload"
          onClick={() => setShowUploadModal(true)}
        >
          Upload Notes
        </button>
      </section>

      <section className="notes-search-row">
        <div className="notes-search">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Search by subject, topic, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
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
                  className={`notes-category ${category.name === activeCategory ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.name)}
                >
                  <span className={`category-dot ${accentClassMap[category.color] || ''}`} />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
            <div className="notes-category-summary">
              <div>
                <span>Total Notes</span>
                <strong>{notes.length}</strong>
              </div>
            </div>
          </div>
        </aside>

        <div className="notes-grid">
          <div className="notes-grid-header">
            <span>Showing {filteredNotes.length} notes</span>
            <div className="notes-grid-pill">Popular</div>
          </div>

          {loading ? (
            <div className="dashboard-loading" style={{ padding: '40px 0', textAlign: 'center' }}>
              <div className="loading-spinner"></div>
              <span>Loading notes...</span>
            </div>
          ) : (
            <div className="notes-cards">
              {filteredNotes.length ? (
                filteredNotes.map((note) => (
                  <article key={note._id} className={`note-card ${accentClassMap[note.accent] || ''}`}>
                    <div className="note-card-head">
                      <div className="note-folder">📁</div>
                      <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          {note.title}
                          {note.status === 'pending' && (
                            <span
                              style={{
                                backgroundColor: '#fffaeb',
                                color: '#b54708',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                border: '1px solid #fec84b',
                                marginLeft: '8px',
                              }}
                            >
                              Pending
                            </span>
                          )}
                        </h3>
                        <span>{note.code}</span>
                      </div>
                    </div>

                    <div className="note-card-body">
                      <strong>{note.topic}</strong>
                      <span>{note.pages} pages</span>
                    </div>

                    <div className="note-card-meta">
                      <span>By {note.author}</span>
                      <span>•</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="note-card-stats">
                      <span>⬇ {note.downloads} downloads</span>
                    </div>

                    <div className="note-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                      <button
                        type="button"
                        className="note-action primary"
                        onClick={() => handleDownload(note._id)}
                      >
                        Download
                      </button>

                      {profile?.role === 'admin' && note.status === 'pending' && (
                        <button
                          type="button"
                          className="note-action primary"
                          onClick={() => handleApprove(note._id)}
                          style={{
                            background: '#12b76a',
                            borderColor: '#12b76a',
                            boxShadow: 'none',
                          }}
                        >
                          Approve
                        </button>
                      )}

                      {profile?.role === 'admin' && (
                        <button
                          type="button"
                          className="note-action outline"
                          onClick={() => handleDelete(note._id)}
                          style={{
                            color: '#f04438',
                            borderColor: '#fda29b',
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '60px 0', textAlign: 'center', color: '#667085' }}>
                  No notes available in this category.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {showUploadModal && (
        <div style={modalOverlayStyle} onClick={() => setShowUploadModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '700', color: '#101828' }}>
              Upload Notes
            </h2>
            <form onSubmit={handleUploadSubmit}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  Title
                  <input
                    type="text"
                    required
                    style={inputStyle}
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="e.g. Data Structures & Algorithms"
                  />
                </label>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  Course Code
                  <input
                    type="text"
                    required
                    style={inputStyle}
                    value={uploadForm.code}
                    onChange={(e) => setUploadForm({ ...uploadForm, code: e.target.value })}
                    placeholder="e.g. CSE 201"
                  />
                </label>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  Topic
                  <input
                    type="text"
                    required
                    style={inputStyle}
                    value={uploadForm.topic}
                    onChange={(e) => setUploadForm({ ...uploadForm, topic: e.target.value })}
                    placeholder="e.g. Binary Trees & BST"
                  />
                </label>
              </div>

              <div style={{ ...formGroupStyle, display: 'flex', flexDirection: 'row', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>
                    Pages
                    <input
                      type="number"
                      required
                      min="1"
                      style={inputStyle}
                      value={uploadForm.pages}
                      onChange={(e) => setUploadForm({ ...uploadForm, pages: parseInt(e.target.value) || 1 })}
                    />
                  </label>
                </div>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>
                    Category
                    <select
                      style={selectStyle}
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    >
                      {categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {uploadError && (
                <p style={{ color: '#d92d20', fontSize: '14px', margin: '8px 0 16px 0' }}>{uploadError}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d0d5dd',
                    backgroundColor: '#ffffff',
                    color: '#344054',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#ff7a00',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

