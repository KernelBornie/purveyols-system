import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Card, { LoadingSpinner, Badge, Button } from '../shared/UI';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '', startDate: '', endDate: '' });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);
      const res = await api.get(`/payments?${params}`);
      setPayments(res.data.payments || []);
    } catch (err) {
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []); // eslint-disable-line

  const totalCompleted = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>💸 Payment History</h2>
        <Link to="/payments/new"><Button variant="success">+ New Payment</Button></Link>
      </div>

      {error && <div style={{ color: '#c62828', marginBottom: '1rem' }}>{error}</div>}

      <Card>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Status</label>
            <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} style={{ padding: '7px 10px', border: '1px solid #ddd', borderRadius: '6px' }}>
              <option value="">All</option>
              {['completed', 'failed', 'processing', 'pending'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>From</label>
            <input type="date" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })} style={{ padding: '7px 10px', border: '1px solid #ddd', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>To</label>
            <input type="date" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })} style={{ padding: '7px 10px', border: '1px solid #ddd', borderRadius: '6px' }} />
          </div>
          <Button onClick={fetchPayments} variant="secondary">🔍 Filter</Button>
        </div>

        {payments.length > 0 && (
          <div style={{ background: '#e8f5e9', padding: '10px 14px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Total Completed: <strong>K{totalCompleted.toLocaleString()}</strong>
          </div>
        )}

        {payments.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No payments found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  {['Worker', 'Amount', 'Days', 'Network', 'Phone', 'Site', 'Status', 'Ref', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '500' }}>{p.worker?.name}</td>
                    <td style={{ padding: '10px 12px' }}>K{p.amount?.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>{p.days}</td>
                    <td style={{ padding: '10px 12px', textTransform: 'uppercase' }}>{p.mobileNetwork}</td>
                    <td style={{ padding: '10px 12px' }}>{p.phoneNumber}</td>
                    <td style={{ padding: '10px 12px' }}>{p.site || '—'}</td>
                    <td style={{ padding: '10px 12px' }}><Badge status={p.status} /></td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.78rem' }}>{p.transactionRef || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PaymentList;
