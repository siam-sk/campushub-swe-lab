import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

export default function Auth() {
  const location = useLocation();
  const [authMode, setAuthMode] = useState(location.state?.mode || 'login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', remember: false });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const navigate = useNavigate();

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const syncWithBackend = async (path, idToken) => {
    const response = await fetch(`${apiBaseUrl}/api/auth/${path}`, {
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

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      const idToken = await result.user.getIdToken();
      await syncWithBackend('login', idToken);
      navigate('/dashboard');
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
      
      if (authForm.name) {
        await updateProfile(result.user, { displayName: authForm.name });
      }

      const idToken = await result.user.getIdToken();
      await syncWithBackend('register', idToken);
      navigate('/dashboard');
    } catch (error) {
      setAuthError(error.message || 'Unable to create account');
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
          <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p>
            {authMode === 'login'
              ? 'Sign in to continue to your account'
              : 'Join the community of learners'}
          </p>
        </div>

        <form onSubmit={authMode === 'login' ? handleLogin : handleSignup}>
          {authMode === 'signup' ? (
            <label className="auth-field">
              <span>Full Name</span>
              <input
                type="text"
                placeholder="Enter your full name"
                value={authForm.name}
                onChange={handleAuthChange('name')}
                required
              />
            </label>
          ) : null}

          <label className="auth-field">
            <span>Email Address</span>
            <input
              type="email"
              placeholder="your.email@university.edu"
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

          {authMode === 'login' ? (
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
          ) : null}

          {authError ? <p className="auth-error">{authError}</p> : null}

          <button className="btn btn-primary auth-submit" type="submit" disabled={authLoading}>
            {authLoading
              ? 'Please wait...'
              : authMode === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="auth-footer">
          {authMode === 'login' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button type="button" className="link-button" onClick={() => setAuthMode('signup')}>
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button type="button" className="link-button" onClick={() => setAuthMode('login')}>
                Sign In
              </button>
            </p>
          )}
          {authMode === 'signup' ? (
            <div className="auth-note">
              Note: CampusHub is designed for academic networking. Please do not share sensitive
              personal information.
            </div>
          ) : null}
          <button type="button" className="link-button" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </section>
    </div>
  );
}