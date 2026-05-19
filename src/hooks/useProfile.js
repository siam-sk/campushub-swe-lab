import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const emptyState = { profile: null, loading: true, error: '' };

export default function useProfile() {
  const [state, setState] = useState(emptyState);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadProfile = async (token) => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to load profile');
        }

        const payload = await response.json();
        if (isMounted) setState({ profile: payload.user || null, loading: false, error: '' });
      } catch (error) {
        if (isMounted) setState({ profile: null, loading: false, error: error.message || 'Unable to load profile' });
      }
    };

    const mockToken = localStorage.getItem('campushub_mock_token');
    
    if (mockToken) {
      loadProfile(mockToken);
    } else {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!isMounted) return;

        if (!user) {
          setState({ profile: null, loading: false, error: '' });
          return;
        }

        const token = await user.getIdToken();
        loadProfile(token);
      });
      
      return () => {
        isMounted = false;
        controller.abort();
        unsubscribe();
      };
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return state;
}
