import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Box from '@mui/material/Box';
import './App.css';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AuthenticatedLayout } from './components/AuthenticatedLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { FamilyChartPage } from './pages/FamilyChartPage';
import { EditPersonPage } from './pages/EditPersonPage';
import { PersonPage } from './pages/PersonPage';
import { PersonFactsPage } from './pages/PersonFactsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { AcceptInvitationPage } from './pages/AcceptInvitationPage';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { MediaPage } from './pages/MediaPage';
import { MapPage } from './pages/MapPage';
import { IdeasPage } from './pages/IdeasPage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { SessionLoading } from './components/SessionLoading';

function PublicOnlyRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <SessionLoading />;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={<Navigate to="/login" replace />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <HomePage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tree"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <FamilyChartPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/person/:id/edit"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <EditPersonPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/person/:id/facts"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <PersonFactsPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/person/:id"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <PersonPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/media"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <MediaPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <MapPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ideas"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <IdeasPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <AccountSettingsPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
