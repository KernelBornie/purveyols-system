import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Login from '../pages/Login';

// Mock the auth API module
vi.mock('../api/auth', () => ({
  login: vi.fn(),
}));

import { login } from '../api/auth';

const renderLogin = () =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ setUser: vi.fn(), loading: false, user: null }}>
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>
  );

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByText('BuildSync CMS')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows an error message on failed login', async () => {
    login.mockRejectedValueOnce(new Error('Invalid credentials'));

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'badpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows loading state while signing in', async () => {
    // login resolves after a short delay
    login.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ token: 'tok', user: {} }), 200))
    );

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('disables the submit button while loading', async () => {
    login.mockImplementation(() => new Promise(() => {})); // never resolves

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });
});
