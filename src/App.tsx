import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Box from '@mui/material/Box';
import './App.css';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FamilyChartPage } from './pages/FamilyChartPage';
import { EditPersonPage } from './pages/EditPersonPage';
import { PersonPage } from './pages/PersonPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { MediaPage } from './pages/MediaPage';
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
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <FamilyChartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/person/:id/edit"
        element={
          <ProtectedRoute>
            <EditPersonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/person/:id"
        element={
          <ProtectedRoute>
            <PersonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/media"
        element={
          <ProtectedRoute>
            <MediaPage />
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
