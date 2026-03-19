import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProcurementForm from '../pages/procurement/ProcurementForm';
import { AuthContext } from '../context/AuthContext';

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}));

import API from '../api/axios';

const renderForm = (role = 'engineer') =>
  render(
    <AuthContext.Provider value={{ user: { role }, loading: false }}>
      <MemoryRouter initialEntries={['/procurement/new']}>
        <Routes>
          <Route path="/procurement/new" element={<ProcurementForm />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('ProcurementForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    API.get.mockResolvedValue({ data: [] });
    API.post.mockResolvedValue({ data: { _id: '1' } });
  });

  it('hides unit price inputs for engineer users', async () => {
    renderForm('engineer');

    expect(await screen.findByText('Items')).toBeInTheDocument();
    expect(screen.queryByText(/Unit Price \(ZMW\)/i)).not.toBeInTheDocument();
  });

  it('shows and enables unit price inputs for procurement users', async () => {
    renderForm('procurement');

    const unitPriceInput = await screen.findByLabelText('Unit Price 1');
    expect(screen.getByText(/Unit Price \(ZMW\)/i)).toBeInTheDocument();
    expect(unitPriceInput).toBeEnabled();
  });

  it('allows adding multiple item rows', async () => {
    renderForm('engineer');
    await screen.findByText('Items');

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Item/i }));

    expect(screen.getAllByLabelText(/Item Name/i)).toHaveLength(2);
  });

  it('does not send unitPrice when engineer submits', async () => {
    renderForm('engineer');
    await screen.findByText('Items');

    const nameInput = screen.getByLabelText('Item Name 1');
    const qtyInput = screen.getByLabelText('Quantity 1');

    fireEvent.change(nameInput, { target: { value: 'Cement' } });
    fireEvent.change(qtyInput, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));

    await waitFor(() => expect(API.post).toHaveBeenCalledTimes(1));
    const payload = API.post.mock.calls[0][1];
    expect(payload.items[0]).not.toHaveProperty('unitPrice');
  });
});
