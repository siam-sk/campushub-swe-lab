import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const emptyState = { profile: null, loading: true, error: '' };

export default function useProfile() {
  const [state, setState] = useState(emptyState);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) {
        return;
      }

      if (!user) {
        setState({ profile: null, loading: false, error: '' });
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to load profile');
        }

        const payload = await response.json();
        setState({ profile: payload.user || null, loading: false, error: '' });
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setState({ profile: null, loading: false, error: error.message || 'Unable to load profile' });
      }
    });

    return () => {
      isMounted = false;
      controller.abort();
      unsubscribe();
    };
  }, []);

  return state;
}
