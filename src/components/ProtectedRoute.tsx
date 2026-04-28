import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { SessionLoading } from './SessionLoading';

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
