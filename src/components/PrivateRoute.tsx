import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface PrivateRouteProps {
  children: ReactNode;
  roles?: Role[];
}

// Wrap a page with an optional role whitelist:
// <PrivateRoute roles={['super-admin']}><SuperAdminDashboard /></PrivateRoute>
export default function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
