import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Auth() {
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', remember: false });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const navigate = useNavigate();

  const syncWithBackend = async (path, idToken) => {
    const response = await fetch(`/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || 'Authentication failed');
    }
  };

  const handleAuthChange = (field) => (event) => {
    const value = field === 'remember' ? event.target.checked : event.target.value;
    setAuthForm((prev) => ({ ...prev, [field]: value }));
  };

  const resolveId = async (id) => {
    const trimmedId = id.trim();
    if (!trimmedId) {
      throw new Error('ID or Email is required');
    }
    const response = await fetch(`/api/auth/resolve-id?id=${encodeURIComponent(trimmedId)}`);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || 'Failed to resolve user ID');
    }
    const data = await response.json();
    return data.email;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const resolvedEmail = await resolveId(authForm.email);

      let idToken;
      // Start Mock Auth Bypass
      if (resolvedEmail.includes('@campushub.edu')) {
        if (authForm.password !== '123456') {
          throw new Error('Invalid ID or Password');
        }
        idToken = `mock-${resolvedEmail}`;
        localStorage.setItem('campushub_mock_token', idToken);
      } else {
        // Real Login Fallback
        const result = await signInWithEmailAndPassword(auth, resolvedEmail, authForm.password);
        idToken = await result.user.getIdToken();
        localStorage.removeItem('campushub_mock_token');
      }
      
      await syncWithBackend('login', idToken);
      navigate('/dashboard');
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark">⌂</span>
          <span>CampusHUB</span>
        </div>

        <div className="auth-panel-content">
          <h1>Your Academic Journey Starts Here</h1>
          <p>
            Connect with thousands of students, access quality notes, and stay updated with campus
            activities.
          </p>

          <div className="auth-panel-stats">
            <div>
              <strong>10K+</strong>
              <span>Active Users</span>
            </div>
            <div>
              <strong>50+</strong>
              <span>Universities</span>
            </div>
          </div>
        </div>

        <footer className="auth-panel-footer">© 2026 CampusHub - Built for Students</footer>
      </aside>

      <section className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue to your account</p>
        </div>

        <form onSubmit={handleLogin}>
          <label className="auth-field">
            <span>Student / Faculty / Admin ID</span>
            <input
              type="text"
              placeholder="Enter your ID or Email"
              value={authForm.email}
              onChange={handleAuthChange('email')}
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              value={authForm.password}
              onChange={handleAuthChange('password')}
              required
            />
          </label>

          <div className="auth-meta">
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={authForm.remember}
                onChange={handleAuthChange('remember')}
              />
              Remember me
            </label>
            <button type="button" className="link-button">
              Forgot password?
            </button>
          </div>

          {authError ? <p className="auth-error">{authError}</p> : null}

          <button className="btn btn-primary auth-submit" type="submit" disabled={authLoading}>
            {authLoading ? 'Please wait...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <button type="button" className="link-button" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </section>
    </div>
  );
}