import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const PaymentList = () => {
  const { user } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/payments')
      .then(r => setPayments(r.data))
      .catch(() => setError('Failed to load payments'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (id, currentStatus) => {
    const statuses = ['pending', 'completed', 'failed'];
    const next = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    if (!window.confirm(`Change status to "${next}"?`)) return;
    try {
      const res = await API.put(`/payments/${id}`, { status: next });
      setPayments(payments.map(p => p._id === id ? res.data : p));
    } catch {
      alert('Failed to update payment status');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Payments</h1>
        {user?.role === 'accountant' && (
          <Link to="/payments/new" className="btn btn-primary">+ New Payment</Link>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="empty-state">No payments found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Recipient</th>
                  <th>Phone</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Network</th>
                  <th>Txn Ref</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment._id}>
                    <td>{payment.paymentType?.replace('_', ' ')}</td>
                    <td><strong>{payment.recipientName}</strong></td>
                    <td>{payment.recipientPhone || '—'}</td>
                    <td>{payment.amount?.toLocaleString()}</td>
                    <td>{payment.currency}</td>
                    <td>{payment.mobileNetwork ? payment.mobileNetwork.toUpperCase() : '—'}</td>
                    <td><code style={{ fontSize: '0.75em' }}>{payment.transactionRef || '—'}</code></td>
                    <td>{payment.project?.name || '—'}</td>
                    <td><span className={`badge badge-${payment.status}`}>{payment.status}</span></td>
                    <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        {user?.role === 'accountant' && (
                          <>
                            <Link to={`/payments/${payment._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleUpdateStatus(payment._id, payment.status)}
                            >
                              Update Status
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

export default PaymentList;
