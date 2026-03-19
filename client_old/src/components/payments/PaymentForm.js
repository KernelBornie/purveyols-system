import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card, { FormField, Input, Select, Button, Alert, LoadingSpinner } from '../shared/UI';

const PaymentForm = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState({ workerId: '', days: '', mobileNetwork: '', paymentPeriodStart: '', paymentPeriodEnd: '', notes: '' });
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get('/workers')
      .then((res) => setWorkers(res.data.workers || []))
      .catch(() => setError('Failed to load workers'))
      .finally(() => setLoadingWorkers(false));
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    const name = e.target.name;
    setForm({ ...form, [name]: val });
    if (name === 'workerId') {
      const w = workers.find((w) => w._id === val);
      setSelectedWorker(w || null);
    }
  };

  const estimatedAmount = selectedWorker && form.days
    ? (selectedWorker.dailyRate * Number(form.days)).toLocaleString()
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post('/payments', { ...form, days: Number(form.days) });
      const { payment, message } = res.data;
      setResult({ payment, message });
      setSuccess(message);
      setForm({ workerId: '', days: '', mobileNetwork: '', paymentPeriodStart: '', paymentPeriodEnd: '', notes: '' });
      setSelectedWorker(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (loadingWorkers) return <LoadingSpinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
        <h2 style={{ margin: 0 }}>💸 Process Wage Payment</h2>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {result && (
        <Card title="Payment Receipt">
          <div style={{ fontSize: '0.9rem', lineHeight: '1.8' }}>
            <div>Worker: <strong>{result.payment.worker?.name}</strong></div>
            <div>Amount: <strong>K{result.payment.amount?.toLocaleString()}</strong></div>
            <div>Days: <strong>{result.payment.days}</strong></div>
            <div>Network: <strong>{result.payment.mobileNetwork?.toUpperCase()}</strong></div>
            <div>Phone: <strong>{result.payment.phoneNumber}</strong></div>
            <div>Status: <strong style={{ color: result.payment.status === 'completed' ? '#2e7d32' : '#c62828', textTransform: 'uppercase' }}>{result.payment.status}</strong></div>
            <div>Ref: <strong>{result.payment.transactionRef}</strong></div>
          </div>
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <FormField label="Select Worker" required>
            <Select name="workerId" value={form.workerId} onChange={handleChange} required>
              <option value="">-- Select Worker --</option>
              {workers.map((w) => (
                <option key={w._id} value={w._id}>{w.name} — NRC: {w.nrc} — {w.site}</option>
              ))}
            </Select>
          </FormField>

          {selectedWorker && (
            <div style={{ background: '#e8f5e9', padding: '10px 14px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.88rem' }}>
              Daily Rate: <strong>K{selectedWorker.dailyRate?.toLocaleString()}</strong> • Phone: <strong>{selectedWorker.phone}</strong>
            </div>
          )}

          <FormField label="Number of Days" required>
            <Input name="days" type="number" value={form.days} onChange={handleChange} placeholder="e.g. 5" min="1" required />
          </FormField>

          {estimatedAmount && (
            <div style={{ background: '#e3f2fd', padding: '10px 14px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.88rem' }}>
              Estimated Payment: <strong>K{estimatedAmount}</strong>
            </div>
          )}

          <FormField label="Mobile Network" required>
            <Select name="mobileNetwork" value={form.mobileNetwork} onChange={handleChange} required>
              <option value="">-- Select Network --</option>
              <option value="airtel">📱 Airtel Money</option>
              <option value="mtn">💛 MTN Mobile Money</option>
            </Select>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Period Start">
              <Input name="paymentPeriodStart" type="date" value={form.paymentPeriodStart} onChange={handleChange} />
            </FormField>
            <FormField label="Period End">
              <Input name="paymentPeriodEnd" type="date" value={form.paymentPeriodEnd} onChange={handleChange} />
            </FormField>
          </div>

          <FormField label="Notes">
            <Input name="notes" value={form.notes} onChange={handleChange} placeholder="Optional notes" />
          </FormField>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button type="submit" disabled={loading} variant="success">
              {loading ? 'Processing...' : '💸 Send Payment'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/payments')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PaymentForm;
