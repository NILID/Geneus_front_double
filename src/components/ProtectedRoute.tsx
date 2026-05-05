import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canManageUsers } from '../auth/roles';
import { useAuth } from '../auth/AuthContext';
import { SessionLoading } from './SessionLoading';

export function AdminRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <SessionLoading />;
  }
  if (!user || !canManageUsers(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SessionLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
