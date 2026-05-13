import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';
import useProfile from '../hooks/useProfile';

export default function RequireRole({ allowedRoles = [], children }) {
  // Bypassing authentication to show the dashboard to the advisor
  return children;
}
