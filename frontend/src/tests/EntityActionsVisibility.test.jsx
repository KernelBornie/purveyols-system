import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import API from '../api/axios';
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

const renderWithRole = (ui, role) =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user: { role } }}>
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>
  );

const workerRow = (overrides = {}) => ({
  _id: 'w1',
  name: 'Worker',
  nrc: '1',
  phone: '',
  dailyRate: 0,
  overtimeRate: 0,
  site: '',
  mobileNetwork: 'airtel',
  enrolledBy: { name: 'E', role: 'engineer' },
  createdAt: new Date().toISOString(),
  isActive: true,
  ...overrides,
});

describe('Engineer-only entity actions and hide inactive records', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'prompt').mockImplementation(() => 'reason');
  });

  it('workers page shows Edit/Delete/Deactivate only for engineer and removes soft-deleted workers', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        workers: [
          workerRow({ _id: 'w1', name: 'Active Worker' }),
          workerRow({ _id: 'w2', name: 'Inactive Worker', nrc: '2', isActive: false }),
        ],
      },
    });
    API.put.mockResolvedValueOnce({ data: { worker: { _id: 'w1', isActive: false } } });
    API.delete.mockResolvedValueOnce({ data: {} });

    const { unmount } = renderWithRole(<WorkerList />, 'engineer');
    await waitFor(() => expect(screen.getByText('Active Worker')).toBeInTheDocument());
    expect(screen.queryByText('Inactive Worker')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(screen.queryByText('Active Worker')).not.toBeInTheDocument());

    unmount();
    API.get.mockResolvedValueOnce({
      data: {
        workers: [workerRow({ _id: 'w3', name: 'Worker Three', nrc: '3' })],
      },
    });
    renderWithRole(<WorkerList />, 'director');
    await waitFor(() => expect(screen.getByText('Worker Three')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('funding page has engineer-only Edit/Delete/Deactivate and hides inactive entries', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        requests: [
          { _id: 'f1', title: 'Active Funding', amount: 1, status: 'pending', createdAt: new Date().toISOString(), requestedBy: { name: 'Eng' }, isActive: true },
          { _id: 'f2', title: 'Inactive Funding', amount: 1, status: 'pending', createdAt: new Date().toISOString(), requestedBy: { name: 'Eng' }, isActive: false },
        ],
      },
    });
    API.put.mockResolvedValueOnce({ data: {} });

    renderWithRole(<FundingRequestList />, 'engineer');
    await waitFor(() => expect(screen.getByText('Active Funding')).toBeInTheDocument());
    expect(screen.queryByText('Inactive Funding')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(screen.queryByText('Active Funding')).not.toBeInTheDocument());
  });

  it('procurement and subcontract pages show engineer-only action buttons and hide inactive rows', async () => {
    API.get
      .mockResolvedValueOnce({
        data: [
          { _id: 'p1', items: [{ name: 'Active Item', quantity: 1 }], status: 'pending', isActive: true },
          { _id: 'p2', items: [{ name: 'Inactive Item', quantity: 1 }], status: 'pending', isActive: false },
        ],
      })
      .mockResolvedValueOnce({
        data: {
          subcontracts: [
            { _id: 's1', type: 'personnel', name: 'Active Subcontract', company: 'A', dateHired: new Date().toISOString(), amount: 1, status: 'active', isActive: true },
            { _id: 's2', type: 'personnel', name: 'Inactive Subcontract', company: 'A', dateHired: new Date().toISOString(), amount: 1, status: 'active', isActive: false },
          ],
        },
      });

    renderWithRole(
      <>
        <ProcurementList />
        <SubcontractList />
      </>,
      'engineer'
    );

    await waitFor(() => expect(screen.getByText('Active Item')).toBeInTheDocument());
    expect(screen.queryByText('Inactive Item')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Delete' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Deactivate' }).length).toBeGreaterThan(0);

    await waitFor(() => expect(screen.getByText('Active Subcontract')).toBeInTheDocument());
    expect(screen.queryByText('Inactive Subcontract')).not.toBeInTheDocument();
  });
});
