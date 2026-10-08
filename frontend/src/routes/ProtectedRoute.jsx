import { Navigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { ROLE_HOME } from '../config/permissions';

// Route-level RBAC guard — the only place that decides whether a route
// is reachable. Components never re-check "is this user allowed here",
// only "is this action allowed for this role" via hasPermission().
// Unauthenticated users go to /login; authenticated users with the wrong
// role go to their own dashboard, never seeing the protected content.
export default function ProtectedRoute({ role: requiredRole, children }) {
  const { role, isAuthenticated } = useRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== requiredRole) {
    return <Navigate to={ROLE_HOME[role] || '/login'} replace />;
  }

  return children;
}