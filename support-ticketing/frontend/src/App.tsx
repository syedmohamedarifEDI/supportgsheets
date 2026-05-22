import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import TicketsPage from './pages/TicketsPage';
import ProjectsPage from './pages/ProjectsPage';
import TechniciansPage from './pages/TechniciansPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950">
      <div className="w-8 h-8 border-2 border-navy-300 border-t-white rounded-full spinner" />
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="technicians" element={<TechniciansPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'DM Sans, sans-serif', borderRadius: '12px', fontSize: '14px' },
            success: { style: { background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' } },
            error: { style: { background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
