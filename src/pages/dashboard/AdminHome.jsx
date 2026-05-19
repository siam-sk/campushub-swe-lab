import React from 'react';

export default function AdminHome() {
  return (
    <div className="dashboard-content">
      <header className="dashboard-header">
        <h1>Admin Control Panel</h1>
        <p>Manage users, content, and system settings.</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">1,245</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Courses</div>
          <div className="stat-value">84</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">System Status</div>
          <div className="stat-value" style={{ color: 'var(--success-color, green)' }}>Healthy</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section col-span-2">
          <h2>Recent Activity</h2>
          <div className="card">
            <ul className="activity-list" style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                <strong>New Faculty Registered</strong> - Dr. Smith joined the CS Department
              </li>
              <li style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                <strong>System Maintenance</strong> - Database backup completed
              </li>
              <li style={{ padding: '1rem' }}>
                <strong>Notice Added</strong> - Fall semester schedule published
              </li>
            </ul>
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn btn-outline" style={{ width: '100%', textAlign: 'left' }}>+ Add New User</button>
            <button className="btn btn-outline" style={{ width: '100%', textAlign: 'left' }}>+ Create Global Notice</button>
            <button className="btn btn-outline" style={{ width: '100%', textAlign: 'left' }}>Manage Permissions</button>
          </div>
        </section>
      </div>
    </div>
  );
}
