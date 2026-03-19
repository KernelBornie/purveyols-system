import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LogbookList from '../pages/logbooks/LogbookList';

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

import API from '../api/axios';

describe('LogbookList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders worker, project, hours/distance, description and formatted date', async () => {
    API.get.mockResolvedValue({
      data: {
        entries: [
          {
            _id: 'work-1',
            type: 'work',
            projectId: { _id: 'p1', name: 'Bridge Project' },
            workerId: { _id: 'u1', name: 'Jane Worker' },
            date: '2026-03-18T10:30:00.000Z',
            hours: 8,
            description: 'Site inspection',
          },
          {
            _id: 'vehicle-1',
            type: 'vehicle',
            project: { _id: 'p2', name: 'Road Upgrade' },
            worker: { _id: 'u2', name: 'Paul Driver' },
            date: '2026-03-18T12:45:00.000Z',
            distanceTravelled: 140,
            description: 'Material transport',
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <LogbookList />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Bridge Project')).toBeInTheDocument());

    expect(screen.getByText('Jane Worker')).toBeInTheDocument();
    expect(screen.getByText('8 hrs')).toBeInTheDocument();
    expect(screen.getByText('Site inspection')).toBeInTheDocument();

    expect(screen.getByText('Road Upgrade')).toBeInTheDocument();
    expect(screen.getByText('Paul Driver')).toBeInTheDocument();
    expect(screen.getByText('140 km')).toBeInTheDocument();
    expect(screen.getByText('Material transport')).toBeInTheDocument();

    const dateCells = screen
      .getAllByRole('cell')
      .filter((cell) => cell.textContent && cell.textContent.includes('/') && cell.textContent.includes(':'));
    expect(dateCells.length).toBeGreaterThanOrEqual(2);
  });
});
