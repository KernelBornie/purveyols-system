import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const ProcurementList = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/procurement')
      .then(r => setOrders(r.data))
      .catch(() => setError('Failed to load procurement orders'))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await API.put(`/procurement/${id}/approve`);
      setOrders(orders.map(o => o._id === id ? res.data : o));
    } catch {
      alert('Failed to approve order');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    try {
      const res = await API.put(`/procurement/${id}/reject`, { rejectionReason: reason });
      setOrders(orders.map(o => o._id === id ? res.data : o));
    } catch {
      alert('Failed to reject order');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Procurement Orders</h1>
        {['director', 'procurement', 'engineer'].includes(user?.role) && (
          <Link to="/procurement/new" className="btn btn-primary">+ New Order</Link>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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
                    <td>{order.unitPrice?.toLocaleString()}</td>
                    <td>{order.totalPrice?.toLocaleString()}</td>
                    <td>{order.project?.name || '—'}</td>
                    <td>{order.supplier || '—'}</td>
                    <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                    <td>
                      <div className="actions">
                        <Link to={`/procurement/${order._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                        {['director', 'engineer'].includes(user?.role) && order.status === 'pending' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(order._id)}>
                              Approve
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(order._id)}>
                              Reject
                            </button>
                          </>
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
