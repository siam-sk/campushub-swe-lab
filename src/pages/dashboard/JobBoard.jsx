import { useEffect, useMemo, useState } from 'react';
import { auth } from '../../firebase';
import useProfile from '../../hooks/useProfile';

const fallbackJobs = [];

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

export default function JobBoardPage() {
  const { profile } = useProfile();
  const [jobs, setJobs] = useState(fallbackJobs);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    company: '',
    description: '',
    tags: '',
    type: 'Internship',
    location: '',
    salaryRange: '',
    deadline: '',
  });

  const getToken = async () => {
    const mockToken = localStorage.getItem('campushub_mock_token');
    if (mockToken) return mockToken;
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const loadJobs = async () => {
    try {
      const token = await getToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/jobs', { headers });
      if (!response.ok) {
        throw new Error('Unable to load jobs');
      }
      const payload = await response.json();
      setJobs(payload.jobs || fallbackJobs);
    } catch (err) {
      console.error(err);
      setJobs(fallbackJobs);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchAsync = async () => {
      // Defer execution to run after effect completes layout/paint
      await Promise.resolve();
      if (active) {
        loadJobs();
      }
    };
    fetchAsync();
    return () => {
      active = false;
    };
  }, []);

  const handleApply = async (jobId) => {
    if (!jobId) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/jobs?action=apply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          jobId, 
          name: profile?.fullName || 'Student', 
          email: profile?.email || 'student@campushub.edu' 
        }),
      });

      if (response.ok) {
        setJobs(prev => prev.map(job => 
          (job._id === jobId || job.title === jobId) 
            ? { ...job, isApplied: true } 
            : job
        ));
        alert('Application submitted successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Apply failed');
      }
    } catch (err) {
      console.error('Apply failed:', err);
      // Demo fallback
      setJobs(prev => prev.map(job => 
        (job._id === jobId || job.title === jobId) 
          ? { ...job, isApplied: true } 
          : job
      ));
      alert('Application submitted successfully! (Demo Mode)');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.title.trim() || !createForm.company.trim() || !createForm.description.trim()) {
      setCreateError('Title, Company, and Description are required.');
      return;
    }

    setCreating(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...createForm,
          tags: createForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post job');
      }

      setShowCreateModal(false);
      setCreateForm({
        title: '',
        company: '',
        description: '',
        tags: '',
        type: 'Internship',
        location: '',
        salaryRange: '',
        deadline: '',
      });
      alert('Job opportunity posted successfully!');
      loadJobs();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const filteredJobs = useMemo(() => {
    let result = jobs;
    if (activeFilter !== 'All') {
      result = result.filter((job) => job.type === activeFilter);
    }
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(lowerQuery) ||
        job.company.toLowerCase().includes(lowerQuery) ||
        (job.tags && job.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );
    }
    return result;
  }, [jobs, activeFilter, searchQuery]);

  return (
    <div className="dashboard-view job-board-view">
      <section className="job-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="feature-pill">New Feature</span>
          <h1>Job Board</h1>
          <p>Find internships, full-time jobs, and freelance opportunities</p>
        </div>
        {profile?.role && ['faculty', 'admin'].includes(profile.role) && (
          <button 
            type="button" 
            className="primary-pill" 
            onClick={() => setShowCreateModal(true)}
            style={{ border: 'none', background: 'var(--accent-color, #f05a28)', color: '#fff', cursor: 'pointer' }}
          >
            + Post a Job
          </button>
        )}
      </section>

      <section className="job-search">
        <div className="job-search-row">
          <input 
            type="search" 
            placeholder="Search jobs by title, company, or skills..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="button" onClick={() => alert('Filters: Entry Level, Experienced, On-site, Remote')}>Advanced Filter</button>
        </div>
        <div className="job-filters">
          {['All', 'Internship', 'Full-time', 'Part-time', 'Freelance'].map((item) => (
            <button
              key={item}
              type="button"
              className={item === activeFilter ? 'active' : ''}
              onClick={() => setActiveFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="job-stats">
        <div className="job-stat-card">
          <strong>{jobs.length}</strong>
          <span>Total Jobs</span>
        </div>
        <div className="job-stat-card">
          <strong>{jobs.filter(j => j.isNew).length || '3'}</strong>
          <span>New Opportunities</span>
        </div>
        <div className="job-stat-card">
          <strong>24+</strong>
          <span>Companies Hiring</span>
        </div>
        <div className="job-stat-card">
          <strong>2 days</strong>
          <span>Avg Response Time</span>
        </div>
      </section>

      <section className="job-list">
        {filteredJobs.length ? (
          filteredJobs.map((job) => (
            <article key={job._id || job.title} className={`job-card ${job.isFeatured ? 'featured' : ''}`}>
              <div>
                <h3>{job.title}</h3>
                <span className="job-company">{job.company}</span>
                <p>{job.description}</p>
                <div className="job-tags">
                  {job.tags?.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="job-meta">
                  <span>{job.location}</span>
                  <span>{job.type}</span>
                  <span>{job.salaryRange}</span>
                  <span>{job.deadline}</span>
                </div>
              </div>
              <div className="job-actions">
                <button type="button" className="secondary-pill" onClick={() => alert(`Details for ${job.title}\nCompany: ${job.company}\nDescription: ${job.description}`)}>View Details</button>
                <button 
                  type="button" 
                  disabled={job.isApplied}
                  className={job.isApplied ? 'applied-btn' : 'primary-pill'}
                  onClick={() => handleApply(job._id || job.title)}
                >
                  {job.isApplied ? 'Applied' : 'Apply Now'}
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">No jobs available yet.</div>
        )}
      </section>

      {/* CREATE JOB MODAL */}
      {showCreateModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Post a New Job</h2>
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
                <label style={labelStyle} htmlFor="job-title">Job Title</label>
                <input
                  id="job-title"
                  type="text"
                  placeholder="e.g. Software Engineer Intern"
                  style={inputStyle}
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="job-company">Company</label>
                <input
                  id="job-company"
                  type="text"
                  placeholder="e.g. Google, Tech innovations"
                  style={inputStyle}
                  value={createForm.company}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, company: e.target.value }))}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="job-description">Description</label>
                <textarea
                  id="job-description"
                  placeholder="Describe job requirements, roles..."
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle} htmlFor="job-type">Job Type</label>
                  <select
                    id="job-type"
                    style={inputStyle}
                    value={createForm.type}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle} htmlFor="job-location">Location</label>
                  <input
                    id="job-location"
                    type="text"
                    placeholder="e.g. Dhaka / Remote"
                    style={inputStyle}
                    value={createForm.location}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle} htmlFor="job-salary">Salary Range</label>
                  <input
                    id="job-salary"
                    type="text"
                    placeholder="e.g. BDT 15k - 20k"
                    style={inputStyle}
                    value={createForm.salaryRange}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, salaryRange: e.target.value }))}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle} htmlFor="job-deadline">Deadline</label>
                  <input
                    id="job-deadline"
                    type="text"
                    placeholder="e.g. Jan 25, 2026"
                    style={inputStyle}
                    value={createForm.deadline}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="job-tags">Skills / Tags (comma separated)</label>
                <input
                  id="job-tags"
                  type="text"
                  placeholder="e.g. React, Node.js, CSS"
                  style={inputStyle}
                  value={createForm.tags}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, tags: e.target.value }))}
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
                  {creating ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
