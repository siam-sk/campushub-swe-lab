import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';
import useProfile from '../hooks/useProfile';

export default function RequireRole({ allowedRoles = [], children }) {
  const { profile, loading } = useProfile();

  if (loading) {
    return <div className="dashboard-loading">Loading your dashboard...</div>;
  }

  if (!auth.currentUser) {
    return <Navigate to="/auth" replace />;
  }

  const role = profile?.role || 'student';
  if (allowedRoles.length && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
