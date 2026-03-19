import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const ProcurementList = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceModal, setPriceModal] = useState(null);
  const [priceForm, setPriceForm] = useState({ supplier: '', items: [] });

  useEffect(() => {
    API.get('/procurement')
      .then(r => setOrders(r.data))
      .catch(() => setError('Failed to load procurement orders'))
      .finally(() => setLoading(false));
  }, []);

  const handleSetPrice = (order) => {
    setPriceForm({
      supplier: order.supplier || '',
      items: (order.items || []).map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice ?? ''
      }))
    });
    setPriceModal(order._id);
  };

  const handlePriceItemChange = (index, value) => {
    const updated = priceForm.items.map((item, i) =>
      i === index ? { ...item, unitPrice: value } : item
    );
    setPriceForm({ ...priceForm, items: updated });
  };

  const handleSubmitPrice = async () => {
    const { supplier, items } = priceForm;
    for (const item of items) {
      const parsed = parseFloat(item.unitPrice);
      if (!item.unitPrice || isNaN(parsed) || parsed <= 0) {
        return alert(`Unit price for "${item.name}" must be a number greater than 0`);
      }
    }
    try {
      const res = await API.put(`/procurement/${priceModal}/price`, {
        supplier,
        items: items.map(i => ({ unitPrice: parseFloat(i.unitPrice) }))
      });
      setOrders(orders.map(o => o._id === priceModal ? res.data : o));
      setPriceModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set price');
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await API.put(`/procurement/${id}/approve`);
      setOrders(orders.map(o => o._id === id ? res.data : o));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve order');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    try {
      const res = await API.put(`/procurement/${id}/reject`, { rejectionReason: reason });
      setOrders(orders.map(o => o._id === id ? res.data : o));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject order');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this procurement order?')) return;
    try {
      const res = await API.put(`/procurement/${id}/deactivate`);
      setOrders(orders.map(o => o._id === id ? res.data.order : o));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate order');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this procurement order? This is a soft delete.')) return;
    try {
      await API.delete(`/procurement/${id}`);
      setOrders(orders.filter(o => o._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete order');
    }
  };

  const handleFund = async (id) => {
    try {
      const res = await API.put(`/procurement/${id}/fund`);
      setOrders(orders.map(o => o._id === id ? res.data : o));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fund order');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Procurement Orders</h1>
        {['engineer', 'foreman', 'driver', 'safety'].includes(user?.role) && (
          <Link to="/procurement/new" className="btn btn-primary">+ New Request</Link>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {priceModal && (
        <div className="modal-overlay">
          <div className="card" style={{ maxWidth: 520, margin: 'auto', padding: '1.5rem' }}>
            <h2>Set Price</h2>
            <div className="form-group">
              <label>Supplier</label>
              <input
                className="form-control"
                value={priceForm.supplier}
                onChange={e => setPriceForm({ ...priceForm, supplier: e.target.value })}
              />
            </div>
            <div className="table-wrapper" style={{ marginBottom: '12px' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit Price (ZMW) *</th>
                  </tr>
                </thead>
                <tbody>
                  {priceForm.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={item.unitPrice}
                          onChange={e => handlePriceItemChange(i, e.target.value)}
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSubmitPrice}>Save Price</button>
              <button className="btn btn-secondary" onClick={() => setPriceModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="loading">Loading procurement orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">No procurement orders found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Items</th>
                  <th>Total (ZMW)</th>
                  <th>Project</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td>
                      {(order.items || []).map((item, i) => (
                        <div key={i}>
                          <strong>{item.name}</strong> &times;{item.quantity}
                          {item.unitPrice != null && (
                            <span style={{ color: '#666', fontSize: '0.85em' }}> @ K{item.unitPrice.toLocaleString()} = K{(item.totalPrice || 0).toLocaleString()}</span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td>{order.totalPrice != null ? `K${order.totalPrice.toLocaleString()}` : '—'}</td>
                    <td>{order.project?.name || '—'}</td>
                    <td>{order.supplier || '—'}</td>
                    <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                    <td>
                      <div className="actions">
                        {user?.role === 'engineer' && (
                          <Link to={`/procurement/${order._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                        )}
                        {user?.role === 'procurement' && order.status === 'pending' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleSetPrice(order)}>
                            Set Price
                          </button>
                        )}
                        {user?.role === 'director' && order.status === 'priced' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(order._id)}>
                              Approve
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(order._id)}>
                              Reject
                            </button>
                          </>
                        )}
                        {user?.role === 'accountant' && order.status === 'approved' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleFund(order._id)}>
                            Fund
                          </button>
                        )}
                        {user?.role === 'engineer' && order.isActive !== false && (
                          <button className="btn btn-warning btn-sm" onClick={() => handleDeactivate(order._id)}>
                            Deactivate
                          </button>
                        )}
                        {user?.role === 'engineer' && order.isActive !== false && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(order._id)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcurementList;
