import { useEffect, useMemo, useState } from 'react';

const fallbackJobs = [];

export default function JobBoardPage() {
  const [jobs, setJobs] = useState(fallbackJobs);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const controller = new AbortController();

    const loadJobs = async () => {
      try {
        const response = await fetch('/api/jobs', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Unable to load jobs');
        }
        const payload = await response.json();
        setJobs(payload.jobs || fallbackJobs);
      } catch {
        setJobs(fallbackJobs);
      }
    };

    loadJobs();

    return () => controller.abort();
  }, []);

  const filteredJobs = useMemo(() => {
    if (activeFilter === 'All') {
      return jobs;
    }
    return jobs.filter((job) => job.type === activeFilter);
  }, [jobs, activeFilter]);

  const handleApply = async (jobId) => {
    if (!jobId) {
      return;
    }

    await fetch('/api/jobs/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, name: 'Student', email: '' }),
    });
  };

  return (
    <div className="dashboard-view job-board-view">
      <section className="job-hero">
        <div>
          <span className="feature-pill">New Feature</span>
          <h1>Job Board</h1>
          <p>Find internships, full-time jobs, and freelance opportunities</p>
        </div>
        <button type="button" className="primary-pill">Post a Job</button>
      </section>

      <section className="job-search">
        <div className="job-search-row">
          <input type="search" placeholder="Search jobs by title, company, or skills..." />
          <button type="button">Advanced Filter</button>
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
          <strong>156</strong>
          <span>Total Jobs</span>
        </div>
        <div className="job-stat-card">
          <strong>23</strong>
          <span>New This Week</span>
        </div>
        <div className="job-stat-card">
          <strong>89</strong>
          <span>Companies</span>
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
                <button type="button" className="secondary-pill">View Details</button>
                <button type="button" className="primary-pill" onClick={() => handleApply(job._id)}>
                  Apply Now
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">No jobs available yet.</div>
        )}
      </section>
    </div>
  );
}
