import { useEffect, useState } from 'react';
import { auth } from '../../firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const fallbackSettings = {
  theme: 'orange',
  notificationsEnabled: true,
  emailNotifications: true,
  smsNotifications: true,
  language: 'English',
  darkMode: false,
  accentColor: 'orange',
};

const getInitials = (name = '') => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(fallbackSettings);
  const [profile, setProfile] = useState({
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
    department: '',
    year: '',
    bio: '',
    avatarUrl: '',
  });

  const [activeTab, setActiveTab] = useState('Profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const getToken = async () => {
    const mockToken = localStorage.getItem('campushub_mock_token');
    if (mockToken) return mockToken;
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch settings
        const settingsRes = await fetch('/api/settings', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (isMounted && settingsData.settings) {
            const s = settingsData.settings;
            setSettings({
              theme: s.theme || 'orange',
              notificationsEnabled: s.notificationsEnabled !== false,
              emailNotifications: s.emailNotifications !== false,
              smsNotifications: s.smsNotifications !== false,
              language: s.language || 'English',
              darkMode: !!s.darkMode,
              accentColor: s.accentColor || 'orange',
            });
            // Apply theme/dark mode preferences immediately
            if (s.darkMode) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            if (s.theme) {
              const themeColor = s.theme;
              document.documentElement.style.setProperty('--accent-color', themeColor === 'orange' ? '#f05a28' : themeColor === 'blue' ? '#3b82f6' : themeColor === 'green' ? '#22c55e' : '#a855f7');
            }
          }
        }

        // Fetch profile
        const profileRes = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (isMounted && profileData.profile?.profileInfo) {
            const info = profileData.profile.profileInfo;
            setProfile({
              fullName: info.fullName || '',
              studentId: info.studentId || '',
              email: info.email || '',
              phone: info.phone || '',
              department: info.department || '',
              year: info.year || '',
              bio: info.bio || '',
              avatarUrl: info.avatarUrl || '',
            });
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error loading settings page data:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const handleSaveSettings = async (updatedSettings = settings) => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token required');
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();
      setSettings(data.settings);
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Save settings failed:', err);
      setErrorMsg(err.message || 'Error saving settings');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token required');
      }

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: profile.phone,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const data = await response.json();
      if (data.profile && data.profile.profileInfo) {
        setProfile({
          fullName: data.profile.profileInfo.fullName || '',
          studentId: data.profile.profileInfo.studentId || '',
          email: data.profile.profileInfo.email || '',
          phone: data.profile.profileInfo.phone || '',
          department: data.profile.profileInfo.department || '',
          year: data.profile.profileInfo.year || '',
          bio: data.profile.profileInfo.bio || '',
          avatarUrl: data.profile.profileInfo.avatarUrl || '',
        });
      }
      setSuccessMsg('Profile information updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Save profile failed:', err);
      setErrorMsg(err.message || 'Error saving profile');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          avatarUrl: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      alert('Please fill in all password fields.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match!');
      return;
    }

    setUploading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No active user session found.');
      }

      const credential = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.new);

      setPasswords({ current: '', new: '', confirm: '' });
      setSuccessMsg('Password updated successfully! Use your new password for the next login.');
    } catch (error) {
      console.error('Password update error:', error);
      setErrorMsg(error.message || 'Failed to update password.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-view settings-view">
      <section className="settings-hero">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </section>

      {successMsg && (
        <div style={{ color: '#039855', backgroundColor: '#ecfdf3', padding: '12px', borderRadius: '12px', border: '1px solid #d1fadf', fontWeight: '500' }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ color: '#d92d20', backgroundColor: '#fef3f2', padding: '12px', borderRadius: '12px', border: '1px solid #fee4e2', fontWeight: '500' }}>
          {errorMsg}
        </div>
      )}

      <section className="settings-grid">
        <aside className="settings-nav">
          {['Profile', 'Notifications', 'Privacy & Security', 'Language & Region', 'Appearance', 'Danger Zone'].map((item) => (
            <button 
              key={item} 
              type="button" 
              className={item === activeTab ? 'active' : ''}
              onClick={() => {
                setActiveTab(item);
                setSuccessMsg('');
                setErrorMsg('');
              }}
            >
              {item}
            </button>
          ))}
        </aside>

        <div className="settings-panels">
          {activeTab === 'Profile' && (
            <section className="settings-panel">
              <h2>Profile Information</h2>
              <div className="settings-profile" style={{ marginTop: '14px' }}>
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="settings-avatar-img" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="settings-avatar">{getInitials(profile.fullName)}</div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  id="avatar-upload" 
                  style={{ display: 'none' }} 
                  onChange={handleImageChange} 
                />
                <label htmlFor="avatar-upload" className="primary-pill" style={{ cursor: 'pointer', padding: '8px 16px', display: 'inline-block' }}>
                  Change Photo
                </label>
              </div>
              <form onSubmit={handleSaveProfile} className="settings-form">
                <label>
                  Full Name (Read-only)
                  <input
                    type="text"
                    value={profile.fullName}
                    disabled
                    style={{ backgroundColor: '#f9fafb', color: '#667085', cursor: 'not-allowed' }}
                  />
                </label>
                <label>
                  Student ID (Read-only)
                  <input 
                    type="text" 
                    value={profile.studentId} 
                    disabled
                    style={{ backgroundColor: '#f9fafb', color: '#667085', cursor: 'not-allowed' }}
                  />
                </label>
                <label>
                  Email Address (Read-only)
                  <input 
                    type="email" 
                    value={profile.email} 
                    disabled
                    style={{ backgroundColor: '#f9fafb', color: '#667085', cursor: 'not-allowed' }}
                  />
                </label>
                <label>
                  Phone Number
                  <input 
                    type="text" 
                    value={profile.phone} 
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </label>
                <label>
                  Department (Read-only)
                  <input 
                    type="text" 
                    value={profile.department} 
                    disabled
                    style={{ backgroundColor: '#f9fafb', color: '#667085', cursor: 'not-allowed' }}
                  />
                </label>
                <label>
                  Year (Read-only)
                  <input 
                    type="text" 
                    value={profile.year} 
                    disabled
                    style={{ backgroundColor: '#f9fafb', color: '#667085', cursor: 'not-allowed' }}
                  />
                </label>
                <label className="settings-bio">
                  Bio
                  <textarea 
                    value={profile.bio} 
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </label>
                <div className="settings-actions" style={{ gridColumn: 'span 2' }}>
                  <button type="submit" className="primary-pill" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === 'Notifications' && (
            <section className="settings-panel">
              <h2>Notifications</h2>
              <p style={{ color: '#667085', fontSize: '14px', marginBottom: '16px' }}>Customize your push, email, and SMS notifications.</p>
              
              <div className="settings-toggle">
                <span>Push Notifications</span>
                <input 
                  type="checkbox" 
                  checked={settings.notificationsEnabled} 
                  onChange={(e) => setSettings(prev => ({ ...prev, notificationsEnabled: e.target.checked }))} 
                />
              </div>
              <div className="settings-toggle">
                <span>Email Notifications</span>
                <input 
                  type="checkbox" 
                  checked={settings.emailNotifications} 
                  onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))} 
                />
              </div>
              <div className="settings-toggle">
                <span>SMS Notifications</span>
                <input 
                  type="checkbox" 
                  checked={settings.smsNotifications} 
                  onChange={(e) => setSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))} 
                />
              </div>

              <div className="settings-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="primary-pill" onClick={() => handleSaveSettings()} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </section>
          )}

          {activeTab === 'Privacy & Security' && (
            <section className="settings-panel">
              <h2>Privacy & Security</h2>
              
              <div className="settings-password">
                <h3>Change Password</h3>
                <input 
                  type="password" 
                  placeholder="Current Password" 
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '16px', padding: '10px 12px' }}
                />
                <input 
                  type="password" 
                  placeholder="New Password" 
                  value={passwords.new}
                  onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '16px', padding: '10px 12px' }}
                />
                <input 
                  type="password" 
                  placeholder="Confirm New Password" 
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '16px', padding: '10px 12px' }}
                />
                <button 
                  type="button" 
                  className="primary-pill" 
                  onClick={handlePasswordUpdate}
                  disabled={uploading}
                  style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                >
                  {uploading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </section>
          )}

          {activeTab === 'Language & Region' && (
            <section className="settings-panel">
              <h2>Language & Region</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#344054' }} htmlFor="language-select">Preferred Language</label>
                <select
                  id="language-select"
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: '16px', border: '1px solid #e5e7eb', fontSize: '15px', outline: 'none', background: '#fff', maxWidth: '300px' }}
                >
                  <option value="English">English</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                </select>
              </div>

              <div className="settings-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="primary-pill" onClick={() => handleSaveSettings()} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </section>
          )}

          {activeTab === 'Appearance' && (
            <section className="settings-panel">
              <h2>Appearance</h2>
              <p style={{ color: '#667085', fontSize: '14px', marginBottom: '16px' }}>Customize dark mode and theme colors.</p>

              <div className="settings-toggle">
                <span>Dark Mode</span>
                <input 
                  type="checkbox" 
                  checked={settings.darkMode} 
                  onChange={(e) => {
                    const nextVal = e.target.checked;
                    setSettings(prev => ({ ...prev, darkMode: nextVal }));
                    if (nextVal) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  }} 
                />
              </div>
              
              <div className="settings-theme" style={{ padding: '12px 0' }}>
                <span>Accent Color</span>
                <div className="theme-swatches">
                  {['orange', 'blue', 'green', 'purple'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`swatch ${color}`}
                      onClick={() => {
                        setSettings(prev => ({ ...prev, theme: color, accentColor: color }));
                        document.documentElement.style.setProperty('--accent-color', color === 'orange' ? '#f05a28' : color === 'blue' ? '#3b82f6' : color === 'green' ? '#22c55e' : '#a855f7');
                      }}
                      style={{
                        border: settings.theme === color ? '3px solid #000' : 'none',
                        cursor: 'pointer',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%'
                      }}
                      title={color.charAt(0).toUpperCase() + color.slice(1)}
                    />
                  ))}
                </div>
              </div>

              <div className="settings-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="primary-pill" onClick={() => handleSaveSettings()} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </section>
          )}

          {activeTab === 'Danger Zone' && (
            <section className="settings-panel danger">
              <h2>Danger Zone</h2>
              <div className="danger-card" style={{ marginTop: '14px' }}>
                <div>
                  <strong>Delete Account</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#667085' }}>Permanently delete your account and all data</p>
                </div>
                <button type="button" className="danger-btn" onClick={() => alert('Account deletion requested (Demo).')}>Delete Account</button>
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
