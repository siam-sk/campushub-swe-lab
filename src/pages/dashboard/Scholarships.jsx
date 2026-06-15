import { useEffect, useState, useMemo } from 'react';
import { auth } from '../../firebase';
import useProfile from '../../hooks/useProfile';

const fallbackScholarships = [];

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
  maxWidth: '550px',
  maxHeight: '90vh',
  overflowY: 'auto',
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

export default function ScholarshipsPage() {
  const { profile } = useProfile();
  const [scholarships, setScholarships] = useState(fallbackScholarships);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    provider: '',
    description: '',
    amount: '',
    type: 'Merit-based',
    deadline: '',
    countries: '',
    awards: '',
    categories: '',
    eligibility: '',
  });

  const getToken = async () => {
    const mockToken = localStorage.getItem('campushub_mock_token');
    if (mockToken) return mockToken;
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const loadScholarships = async () => {
    try {
      const token = await getToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/scholarships', { headers });
      if (!response.ok) {
        throw new Error('Unable to load scholarships');
      }
      const payload = await response.json();
      setScholarships(payload.scholarships || fallbackScholarships);
    } catch (err) {
      console.error(err);
      setScholarships(fallbackScholarships);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadScholarships();
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleApply = async (scholarshipId) => {
    if (!scholarshipId) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/scholarships?action=apply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          scholarshipId, 
          name: profile?.fullName || 'Student', 
          email: profile?.email || 'student@campushub.edu' 
        }),
      });

      if (response.ok) {
        setScholarships(prev => prev.map(item => 
          (item._id === scholarshipId || item.title === scholarshipId) 
            ? { ...item, isApplied: true, applicants: (item.applicants || 0) + 1 } 
            : item
        ));
        alert('Scholarship application submitted successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Apply failed');
      }
    } catch (err) {
      console.error('Apply failed:', err);
      // Demo fallback
      setScholarships(prev => prev.map(item => 
        (item._id === scholarshipId || item.title === scholarshipId) 
          ? { ...item, isApplied: true, applicants: (item.applicants || 0) + 1 } 
          : item
      ));
      alert('Scholarship application submitted successfully! (Demo Mode)');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.title.trim() || !createForm.provider.trim() || !createForm.description.trim()) {
      setCreateError('Title, Provider, and Description are required.');
      return;
    }

    setCreating(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await fetch('/api/scholarships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...createForm,
          amount: String(createForm.amount),
          awards: Number(createForm.awards || 1),
          countries: createForm.countries.split(',').map(c => c.trim()).filter(Boolean),
          categories: createForm.categories.split(',').map(c => c.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create scholarship');
      }

      setShowCreateModal(false);
      setCreateForm({
        title: '',
        provider: '',
        description: '',
        amount: '',
        type: 'Merit-based',
        deadline: '',
        countries: '',
        awards: '',
        categories: '',
        eligibility: '',
      });
      alert('Scholarship funding opportunity published successfully!');
      loadScholarships();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleSave = (scholarshipId) => {
    setScholarships(prev => prev.map(item => 
      (item._id === scholarshipId || item.title === scholarshipId)
        ? { ...item, isSaved: !item.isSaved }
        : item
    ));
    const isSavedCurrently = scholarships.find(item => item._id === scholarshipId || item.title === scholarshipId)?.isSaved;
    alert(isSavedCurrently ? 'Scholarship removed from bookmarks.' : 'Scholarship bookmarked for later!');
  };

  const filteredScholarships = useMemo(() => {
    let result = scholarships;
    
    if (activeFilter !== 'All') {
      result = result.filter(item => item.categories && item.categories.includes(activeFilter));
    }
    
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.title && item.title.toLowerCase().includes(lowerQuery)) ||
        (item.provider && item.provider.toLowerCase().includes(lowerQuery)) ||
        (item.description && item.description.toLowerCase().includes(lowerQuery))
      );
    }
    
    return result;
  }, [scholarships, searchQuery, activeFilter]);

  return (
    <div className="dashboard-view scholarships-view">
      <section className="scholarships-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="feature-pill">New Feature</span>
          <h1>Scholarship Portal</h1>
          <p>Discover funding opportunities for your education</p>
        </div>
        {profile?.role && ['faculty', 'admin'].includes(profile.role) && (
          <button 
            type="button" 
            className="primary-pill"
            onClick={() => setShowCreateModal(true)}
            style={{ border: 'none', background: 'var(--accent-color, #f05a28)', color: '#fff', cursor: 'pointer' }}
          >
            + Create Scholarship
          </button>
        )}
      </section>

      <section className="scholarships-stats">
        <div className="scholarship-stat-card">
          <strong>{scholarships.length ? `${scholarships.length}+` : '250+'}</strong>
          <span>Available Scholarships</span>
        </div>
        <div className="scholarship-stat-card">
          <strong>$50M+</strong>
          <span>Total Funding</span>
        </div>
        <div className="scholarship-stat-card">
          <strong>10,000+</strong>
          <span>Students Helped</span>
        </div>
        <div className="scholarship-stat-card">
          <strong>85%</strong>
          <span>Success Rate</span>
        </div>
      </section>

      <section className="scholarships-search">
        <input 
          type="search" 
          placeholder="Search scholarships by name, provider, or keyword..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="button" onClick={() => alert('Filter options: Global availability, merit-based vs research.')}>Advanced Filter</button>
        <div className="scholarships-filters">
          {['All', 'Technology', 'Research', 'Education', 'Diversity', 'Exchange'].map((item) => (
            <button key={item} type="button" className={item === activeFilter ? 'active' : ''} onClick={() => setActiveFilter(item)}>{item}</button>
          ))}
        </div>
      </section>

      <section className="scholarships-list">
        {filteredScholarships.length ? (
          filteredScholarships.map((item) => (
            <article key={item._id || item.title} className="scholarship-card">
              <div className="scholarship-header">
                <div>
                  <h3>{item.title}</h3>
                  <span>{item.provider}</span>
                </div>
                <div className="scholarship-amount">
                  {item.isNew ? <span className="pill-new">New</span> : null}
                  <strong>${item.amount}</strong>
                </div>
              </div>
              <p>{item.description}</p>
              <div className="scholarship-meta">
                <span>Deadline: {item.deadline}</span>
                <span>Countries: {item.countries?.join(', ')}</span>
                <span>Applicants: {item.applicants || 0}</span>
                <span>Awards: {item.awards}</span>
              </div>
              <div className="scholarship-tags">
                {item.categories?.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
                {item.type ? <span>{item.type}</span> : null}
              </div>
              <div className="scholarship-eligibility">
                <strong>Eligibility Criteria</strong>
                <p>{item.eligibility}</p>
              </div>
              <div className="scholarship-actions">
                <button 
                  type="button" 
                  disabled={item.isApplied}
                  className={item.isApplied ? 'applied-btn' : 'primary-pill'}
                  onClick={() => handleApply(item._id || item.title)}
                >
                  {item.isApplied ? 'Applied' : 'Apply Now'}
                </button>
                <button type="button" className="secondary-pill" onClick={() => alert(`Details for ${item.title}\nProvider: ${item.provider}\nDescription: ${item.description}\nEligibility: ${item.eligibility}`)}>More Details</button>
                <button 
                  type="button" 
                  className={`secondary-pill ${item.isSaved ? 'active' : ''}`}
                  onClick={() => handleToggleSave(item._id || item.title)}
                  style={item.isSaved ? { borderColor: 'var(--accent-color)', color: 'var(--accent-color)' } : {}}
                >
                  {item.isSaved ? '★ Saved' : '☆ Save for Later'}
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">No scholarships available yet.</div>
        )}
      </section>

      {/* CREATE SCHOLARSHIP MODAL */}
      {showCreateModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Submit Scholarship Opportunity</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#667085' }}
              >
                &times;
              </button>
            </div>

            {createError ? (
              <div style={{ color: '#d92d20', backgroundColor: '#fef3f2', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {createError}
              </div>
            ) : null}

            <form onSubmit={handleCreateSubmit}>
              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="sch-title">Scholarship Title</label>
                <input
                  id="sch-title"
                  type="text"
                  placeholder="e.g. Google CS Fellowship"
                  style={inputStyle}
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="sch-provider">Provider / Organization</label>
                <input
                  id="sch-provider"
                  type="text"
                  placeholder="e.g. Google, Microsoft, UIU"
                  style={inputStyle}
                  value={createForm.provider}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, provider: e.target.value }))}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="sch-description">Description</label>
                <textarea
                  id="sch-description"
                  placeholder="Describe the opportunity..."
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle} htmlFor="sch-amount">Grant Amount ($)</label>
                  <input
                    id="sch-amount"
                    type="number"
                    placeholder="e.g. 5000"
                    style={inputStyle}
                    value={createForm.amount}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle} htmlFor="sch-type">Type</label>
                  <select
                    id="sch-type"
                    style={inputStyle}
                    value={createForm.type}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="Merit-based">Merit-based</option>
                    <option value="Research-based">Research-based</option>
                    <option value="Diversity">Diversity / Need-based</option>
                    <option value="Exchange">Exchange Program</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle} htmlFor="sch-deadline">Deadline</label>
                  <input
                    id="sch-deadline"
                    type="text"
                    placeholder="e.g. 20/03/2026"
                    style={inputStyle}
                    value={createForm.deadline}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle} htmlFor="sch-awards">Number of Awards</label>
                  <input
                    id="sch-awards"
                    type="number"
                    placeholder="e.g. 10"
                    style={inputStyle}
                    value={createForm.awards}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, awards: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle} htmlFor="sch-countries">Countries (comma separated)</label>
                  <input
                    id="sch-countries"
                    type="text"
                    placeholder="e.g. Global, Bangladesh"
                    style={inputStyle}
                    value={createForm.countries}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, countries: e.target.value }))}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle} htmlFor="sch-categories">Categories (comma separated)</label>
                  <input
                    id="sch-categories"
                    type="text"
                    placeholder="e.g. Technology, Research"
                    style={inputStyle}
                    value={createForm.categories}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, categories: e.target.value }))}
                  />
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="sch-eligibility">Eligibility Requirements</label>
                <input
                  id="sch-eligibility"
                  type="text"
                  placeholder="e.g. CS students with GPA 3.5+"
                  style={inputStyle}
                  value={createForm.eligibility}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, eligibility: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '10px 16px', border: '1px solid #d0d5dd', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: '600', color: '#344054' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ padding: '10px 16px', border: 'none', borderRadius: '8px', background: 'var(--accent-color, #f05a28)', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
                >
                  {creating ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
