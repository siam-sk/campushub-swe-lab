import { useEffect, useState, useMemo } from 'react';

const fallbackScholarships = [];

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState(fallbackScholarships);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const controller = new AbortController();

    const loadScholarships = async () => {
      try {
        const response = await fetch('/api/scholarships', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Unable to load scholarships');
        }
        const payload = await response.json();
        setScholarships(payload.scholarships || fallbackScholarships);
      } catch {
        setScholarships(fallbackScholarships);
      }
    };

    loadScholarships();

    return () => controller.abort();
  }, []);

  const handleApply = async (scholarshipId) => {
    if (!scholarshipId) {
      return;
    }

    await fetch('/api/scholarships/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scholarshipId, name: 'Student', email: '' }),
    });
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
      <section className="scholarships-hero">
        <span className="feature-pill">New Feature</span>
        <h1>Scholarship Portal</h1>
        <p>Discover funding opportunities for your education</p>
        <button type="button" className="primary-pill">Submit Scholarship</button>
      </section>

      <section className="scholarships-stats">
        <div className="scholarship-stat-card">
          <strong>250+</strong>
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
        <button type="button">Advanced Filter</button>
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
                <span>Applicants: {item.applicants}</span>
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
                <button type="button" className="primary-pill" onClick={() => handleApply(item._id)}>
                  Apply Now
                </button>
                <button type="button" className="secondary-pill" onClick={() => alert(`Details for ${item.title}\nProvider: ${item.provider}\nDescription: ${item.description}\nEligibility: ${item.eligibility}`)}>More Details</button>
                <button type="button" className="secondary-pill" onClick={() => alert(`${item.title} saved for later!`)}>Save for Later</button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">No scholarships available yet.</div>
        )}
      </section>
    </div>
  );
}
