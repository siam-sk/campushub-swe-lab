import { useEffect, useState } from 'react';

const fallbackSettings = {
  profile: {
    fullName: 'John Student',
    studentId: '2021CSE089',
    email: 'john.student@university.edu',
    phone: '+880 1234-567890',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    bio: 'Tell us about yourself...',
  },
  notifications: {
    push: true,
    email: true,
    notices: true,
    messages: true,
  },
  privacy: {
    publicProfile: true,
    showEmail: false,
    showPhone: false,
  },
  appearance: {
    darkMode: false,
    theme: 'orange',
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(fallbackSettings);

  useEffect(() => {
    const controller = new AbortController();

    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Unable to load settings');
        }
        const payload = await response.json();
        setSettings(payload.settings || fallbackSettings);
      } catch {
        setSettings(fallbackSettings);
      }
    };

    loadSettings();

    return () => controller.abort();
  }, []);

  const handleSave = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  };

  return (
    <div className="dashboard-view settings-view">
      <section className="settings-hero">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </section>

      <section className="settings-grid">
        <aside className="settings-nav">
          {['Profile', 'Notifications', 'Privacy & Security', 'Language & Region', 'Appearance'].map((item) => (
            <button key={item} type="button" className={item === 'Profile' ? 'active' : ''}>
              {item}
            </button>
          ))}
        </aside>

        <div className="settings-panels">
          <section className="settings-panel">
            <h2>Profile Information</h2>
            <div className="settings-profile">
              <div className="settings-avatar">JS</div>
              <button type="button">Change Photo</button>
            </div>
            <div className="settings-form">
              <label>
                Full Name
                <input
                  type="text"
                  value={settings.profile.fullName}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, fullName: event.target.value },
                    }))
                  }
                />
              </label>
              <label>
                Student ID
                <input type="text" value={settings.profile.studentId} readOnly />
              </label>
              <label>
                Email Address
                <input type="email" value={settings.profile.email} readOnly />
              </label>
              <label>
                Phone Number
                <input type="text" value={settings.profile.phone} readOnly />
              </label>
              <label>
                Department
                <input type="text" value={settings.profile.department} readOnly />
              </label>
              <label>
                Year
                <input type="text" value={settings.profile.year} readOnly />
              </label>
              <label className="settings-bio">
                Bio
                <textarea value={settings.profile.bio} readOnly />
              </label>
            </div>
            <div className="settings-actions">
              <button type="button" className="primary-pill" onClick={handleSave}>
                Save Changes
              </button>
              <button type="button" className="secondary-pill">Cancel</button>
            </div>
          </section>

          <section className="settings-panel">
            <h2>Notifications</h2>
            <div className="settings-toggle">
              <span>Push Notifications</span>
              <input type="checkbox" checked={settings.notifications.push} readOnly />
            </div>
            <div className="settings-toggle">
              <span>Email Notifications</span>
              <input type="checkbox" checked={settings.notifications.email} readOnly />
            </div>
            <div className="settings-toggle">
              <span>Notice Board Alerts</span>
              <input type="checkbox" checked={settings.notifications.notices} readOnly />
            </div>
            <div className="settings-toggle">
              <span>Message Notifications</span>
              <input type="checkbox" checked={settings.notifications.messages} readOnly />
            </div>
          </section>

          <section className="settings-panel">
            <h2>Privacy & Security</h2>
            <div className="settings-toggle">
              <span>Public Profile</span>
              <input type="checkbox" checked={settings.privacy.publicProfile} readOnly />
            </div>
            <div className="settings-toggle">
              <span>Show Email</span>
              <input type="checkbox" checked={settings.privacy.showEmail} readOnly />
            </div>
            <div className="settings-toggle">
              <span>Show Phone Number</span>
              <input type="checkbox" checked={settings.privacy.showPhone} readOnly />
            </div>
            <div className="settings-password">
              <h3>Change Password</h3>
              <input type="password" placeholder="Current Password" />
              <input type="password" placeholder="New Password" />
              <input type="password" placeholder="Confirm New Password" />
              <button type="button" className="primary-pill">Update Password</button>
            </div>
          </section>

          <section className="settings-panel">
            <h2>Appearance</h2>
            <div className="settings-toggle">
              <span>Dark Mode</span>
              <input type="checkbox" checked={settings.appearance.darkMode} readOnly />
            </div>
            <div className="settings-theme">
              <span>Theme Color</span>
              <div className="theme-swatches">
                {['orange', 'blue', 'green', 'purple'].map((color) => (
                  <span key={color} className={`swatch ${color}`}></span>
                ))}
              </div>
            </div>
          </section>

          <section className="settings-panel danger">
            <h2>Danger Zone</h2>
            <div className="danger-card">
              <div>
                <strong>Delete Account</strong>
                <p>Permanently delete your account and all data</p>
              </div>
              <button type="button" className="danger-btn">Delete Account</button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
