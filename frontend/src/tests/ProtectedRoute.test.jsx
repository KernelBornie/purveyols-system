import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const Dashboard = () => <div>Dashboard</div>;
const LoginPage = () => <div>Login Page</div>;

const renderWithAuth = (user, loading = false, initialPath = '/dashboard') =>
  render(
    <AuthContext.Provider value={{ user, loading }}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['director', 'admin']}>
                <div>Admin Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('ProtectedRoute', () => {
  it('shows a loading indicator while auth state is loading', () => {
    renderWithAuth(null, true);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', () => {
    renderWithAuth(null, false);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders children for an authenticated user', () => {
    renderWithAuth({ role: 'engineer' }, false);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('redirects to /dashboard when role is not allowed', () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'engineer' }, loading: false }}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['director', 'admin']}>
                  <div>Admin Page</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin Page')).not.toBeInTheDocument();
  });

  it('renders children when user role is allowed', () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'director' }, loading: false }}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['director', 'admin']}>
                  <div>Admin Page</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Admin Page')).toBeInTheDocument();
  });
});
