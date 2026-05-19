import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';
import useProfile from '../hooks/useProfile';

export default function RequireRole({ allowedRoles = [], children }) {
  const { profile, loading } = useProfile();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!profile) {
    return <Navigate to="/auth" replace state={{ mode: 'login' }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
