import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BOQForm from '../pages/boq/BOQForm';

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import API from '../api/axios';

const renderBOQForm = () =>
  render(
    <MemoryRouter initialEntries={['/boq/new']}>
      <Routes>
        <Route path="/boq/new" element={<BOQForm />} />
        <Route path="/boq" element={<div>BOQ List</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('BOQForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    API.get.mockResolvedValue({ data: [] });
    API.post.mockResolvedValue({ data: { boq: { _id: 'boq-1' } } });
  });

  it('adds and removes BOQ item rows dynamically', async () => {
    const { container } = renderBOQForm();

    await waitFor(() => expect(API.get).toHaveBeenCalledWith('/projects'));

    const addButton = screen.getByRole('button', { name: /\+ add item/i });
    fireEvent.click(addButton);

    let bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows).toHaveLength(2);

    const removeButtons = screen.getAllByRole('button', { name: /remove item/i });
    fireEvent.click(removeButtons[0]);

    bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows).toHaveLength(1);
  });

  it('calculates item amounts and total, then submits amount data for each item', async () => {
    const { container } = renderBOQForm();

    await waitFor(() => expect(API.get).toHaveBeenCalledWith('/projects'));

    fireEvent.change(container.querySelector('input[name="title"]'), {
      target: { value: 'Roadwork BOQ' },
    });

    const addButton = screen.getByRole('button', { name: /\+ add item/i });
    fireEvent.click(addButton);

    let bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows).toHaveLength(2);

    const firstInputs = bodyRows[0].querySelectorAll('input');
    fireEvent.change(firstInputs[0], { target: { value: 'Cement' } });
    fireEvent.change(firstInputs[1], { target: { value: 'bag' } });
    fireEvent.change(firstInputs[2], { target: { value: '2' } });
    fireEvent.change(firstInputs[3], { target: { value: '10' } });

    const secondInputs = bodyRows[1].querySelectorAll('input');
    fireEvent.change(secondInputs[0], { target: { value: 'Sand' } });
    fireEvent.change(secondInputs[1], { target: { value: 'm3' } });
    fireEvent.change(secondInputs[2], { target: { value: '3' } });
    fireEvent.change(secondInputs[3], { target: { value: '5' } });

    expect(screen.getByText('K20')).toBeInTheDocument();
    expect(screen.getByText('K15')).toBeInTheDocument();
    expect(screen.getByText('K35')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /create boq/i }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/boq', {
        title: 'Roadwork BOQ',
        site: '',
        project: undefined,
        notes: '',
        items: [
          { description: 'Cement', unit: 'bag', quantity: 2, unitRate: 10, amount: 20 },
          { description: 'Sand', unit: 'm3', quantity: 3, unitRate: 5, amount: 15 },
        ],
      });
    });
  });
});
