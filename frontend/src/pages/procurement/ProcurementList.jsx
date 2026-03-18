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
  const [priceForm, setPriceForm] = useState({ supplier: '', unitPrice: '' });

  useEffect(() => {
    API.get('/procurement')
      .then(r => setOrders(r.data))
      .catch(() => setError('Failed to load procurement orders'))
      .finally(() => setLoading(false));
  }, []);

  const handleSetPrice = (order) => {
    setPriceForm({ supplier: order.supplier || '', unitPrice: order.unitPrice ?? '' });
    setPriceModal(order._id);
  };

  const handleSubmitPrice = async () => {
    const { supplier, unitPrice } = priceForm;
    const parsedPrice = parseFloat(unitPrice);
    if (!unitPrice || isNaN(parsedPrice) || parsedPrice <= 0) {
      return alert('Unit price must be a number greater than 0');
    }
    try {
      const res = await API.put(`/procurement/${priceModal}/price`, { supplier, unitPrice: parsedPrice });
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
          <div className="card" style={{ maxWidth: 400, margin: 'auto', padding: '1.5rem' }}>
            <h2>Set Price</h2>
            <div className="form-group">
              <label>Supplier</label>
              <input
                className="form-control"
                value={priceForm.supplier}
                onChange={e => setPriceForm({ ...priceForm, supplier: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Unit Price (ZMW) *</label>
              <input
                type="number"
                className="form-control"
                value={priceForm.unitPrice}
                onChange={e => setPriceForm({ ...priceForm, unitPrice: e.target.value })}
                min="0"
                required
              />
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
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Project</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td><strong>{order.itemName}</strong></td>
                    <td>{order.quantity}</td>
                    <td>{order.unitPrice != null ? order.unitPrice.toLocaleString() : '—'}</td>
                    <td>{order.totalPrice != null ? order.totalPrice.toLocaleString() : '—'}</td>
                    <td>{order.project?.name || '—'}</td>
                    <td>{order.supplier || '—'}</td>
                    <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                    <td>
                      <div className="actions">
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
