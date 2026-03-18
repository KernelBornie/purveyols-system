import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AttendanceList from '../pages/attendance/AttendanceList';

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import API from '../api/axios';

const mockWorkers = [
  {
    _id: 'worker1',
    name: 'Alice Banda',
    nrc: '123456/78/1',
    dailyRate: 150,
    overtimeRate: 25,
    isActive: true,
    status: 'active',
  },
  {
    _id: 'worker2',
    name: 'Bob Mwale',
    nrc: '654321/87/2',
    dailyRate: 200,
    overtimeRate: 30,
    isActive: true,
    status: 'active',
  },
];

const renderAttendanceList = () =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user: { name: 'Admin', role: 'director' } }}>
        <AttendanceList />
      </AuthContext.Provider>
    </MemoryRouter>
  );

describe('AttendanceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    API.get.mockResolvedValue({ data: { workers: mockWorkers } });
  });

  it('renders the page header and date picker', async () => {
    renderAttendanceList();
    expect(screen.getByText(/Attendance/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/Date/i)).toBeInTheDocument());
  });

  it('displays workers with their overtime rate from worker profile', async () => {
    renderAttendanceList();
    await waitFor(() => expect(screen.getByText('Alice Banda')).toBeInTheDocument());

    const rows = screen.getAllByRole('row');
    // Row 0 is the header; row 1 = Alice, row 2 = Bob
    expect(within(rows[1]).getByText('K25')).toBeInTheDocument();
    expect(within(rows[2]).getByText('K30')).toBeInTheDocument();
  });

  it('shows overtime hours input (not overtime rate input) when marking attendance', async () => {
    renderAttendanceList();
    await waitFor(() => expect(screen.getByText('Alice Banda')).toBeInTheDocument());

    const markButtons = screen.getAllByRole('button', { name: /Mark/i });
    fireEvent.click(markButtons[0]);

    // Should have OT hours input
    expect(screen.getByPlaceholderText('OT hrs')).toBeInTheDocument();
    // Should NOT have OT rate input (rate comes from worker profile)
    expect(screen.queryByPlaceholderText('OT rate')).not.toBeInTheDocument();
  });

  it('calculates wage for day using worker overtimeRate', async () => {
    API.post.mockResolvedValue({
      data: {
        attendance: {
          _id: 'att1',
          status: 'present',
          overtimeHours: 2,
          overtimeRate: 25,
        },
      },
    });

    renderAttendanceList();
    await waitFor(() => expect(screen.getByText('Alice Banda')).toBeInTheDocument());

    // Click Mark for Alice
    const markButtons = screen.getAllByRole('button', { name: /Mark/i });
    fireEvent.click(markButtons[0]);

    // Fill in overtime hours
    const otHrsInput = screen.getByPlaceholderText('OT hrs');
    fireEvent.change(otHrsInput, { target: { value: '2' } });

    // Save
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      // wage = 150 (dailyRate) + 2 * 25 (overtimeRate from worker) = 200
      expect(screen.getByText('K200')).toBeInTheDocument();
    });
  });

  it('sends overtimeHours but not overtimeRate in the API request', async () => {
    API.post.mockResolvedValue({
      data: {
        attendance: {
          _id: 'att1',
          status: 'present',
          overtimeHours: 3,
          overtimeRate: 25,
        },
      },
    });

    renderAttendanceList();
    await waitFor(() => expect(screen.getByText('Alice Banda')).toBeInTheDocument());

    const markButtons = screen.getAllByRole('button', { name: /Mark/i });
    fireEvent.click(markButtons[0]);

    fireEvent.change(screen.getByPlaceholderText('OT hrs'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/attendance/mark', {
        workerId: 'worker1',
        date: expect.any(String),
        status: 'present',
        overtimeHours: 3,
      });
    });
  });
});
