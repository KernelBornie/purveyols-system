import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import WorkerList from '../pages/workers/WorkerList';
import FundingRequestList from '../pages/funding/FundingRequestList';
import ProcurementList from '../pages/procurement/ProcurementList';
import SubcontractList from '../pages/subcontracts/SubcontractList';

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import API from '../api/axios';

const renderWithRole = (ui, role) =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user: { role } }}>
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>
  );

describe('Entity action buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Edit, Deactivate and Delete buttons for engineer on worker list', async () => {
    API.get.mockResolvedValueOnce({
      data: { workers: [{ _id: 'w1', name: 'W', nrc: '1', isActive: true, enrolledBy: { name: 'E', role: 'engineer' } }] },
    });
    renderWithRole(<WorkerList />, 'engineer');

    await waitFor(() => expect(screen.getByText('W')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('hides Edit, Deactivate and Delete buttons for non-engineer on worker list', async () => {
    API.get.mockResolvedValueOnce({
      data: { workers: [{ _id: 'w1', name: 'W', nrc: '1', isActive: true, enrolledBy: { name: 'E', role: 'engineer' } }] },
    });
    renderWithRole(<WorkerList />, 'director');

    await waitFor(() => expect(screen.getByText('W')).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('shows Edit, Deactivate and Delete buttons for engineer on funding list', async () => {
    API.get.mockResolvedValueOnce({
      data: { requests: [{ _id: 'f1', title: 'Fund A', amount: 10, status: 'pending', isActive: true, createdAt: new Date().toISOString() }] },
    });
    renderWithRole(<FundingRequestList />, 'engineer');

    await waitFor(() => expect(screen.getByText('Fund A')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('shows Edit, Deactivate and Delete buttons for engineer on procurement list', async () => {
    API.get.mockResolvedValueOnce({
      data: [{ _id: 'p1', items: [{ name: 'Cement', quantity: 1 }], status: 'pending', isActive: true }],
    });
    renderWithRole(<ProcurementList />, 'engineer');

    await waitFor(() => expect(screen.getByText('Cement')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('shows Edit, Deactivate and Delete buttons for engineer on subcontract list', async () => {
    API.get.mockResolvedValueOnce({
      data: { subcontracts: [{ _id: 's1', type: 'personnel', name: 'Sub 1', company: 'C', dateHired: new Date().toISOString(), amount: 1, status: 'active', isActive: true }] },
    });
    renderWithRole(<SubcontractList />, 'engineer');

    await waitFor(() => expect(screen.getByText('Sub 1')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
