import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { saveForSync, STORES, saveToStore } from '../../utils/indexedDB';
import Card, { FormField, Input, Select, Button, Alert } from '../shared/UI';

const SITES = ['Site A', 'Site B', 'Site C', 'Site D', 'Main Office'];

const WorkerEnrollment = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', nrc: '', phone: '', dailyRate: '', site: '', jobRole: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isOffline) {
        // Save for later sync
        await saveForSync({ type: 'CREATE_WORKER', data: form });
        setSuccess('Worker saved offline. Will sync when online.');
        setForm({ name: '', nrc: '', phone: '', dailyRate: '', site: '', jobRole: '' });
      } else {
        const res = await api.post('/workers', { ...form, dailyRate: Number(form.dailyRate) });
        await saveToStore(STORES.workers, res.data.worker);
        setSuccess(`Worker ${res.data.worker.name} enrolled successfully!`);
        setForm({ name: '', nrc: '', phone: '', dailyRate: '', site: '', jobRole: '' });
        setTimeout(() => navigate('/workers'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to enroll worker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
        <h2 style={{ margin: 0, color: '#333' }}>👷 Enroll New Worker</h2>
        {isOffline && <span style={{ background: '#fff3e0', color: '#e65100', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem' }}>OFFLINE</span>}
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <Card>
        <form onSubmit={handleSubmit}>
          <FormField label="Full Name" required>
            <Input name="name" value={form.name} onChange={handleChange} placeholder="John Banda" required />
          </FormField>
          <FormField label="NRC Number" required>
            <Input name="nrc" value={form.nrc} onChange={handleChange} placeholder="123456/78/9" required />
          </FormField>
          <FormField label="Phone Number" required>
            <Input name="phone" value={form.phone} onChange={handleChange} placeholder="0977xxxxxx" required />
          </FormField>
          <FormField label="Daily Rate (ZMW)" required>
            <Input name="dailyRate" type="number" value={form.dailyRate} onChange={handleChange} placeholder="150" min="0" required />
          </FormField>
          <FormField label="Site" required>
            <Select name="site" value={form.site} onChange={handleChange} required>
              <option value="">-- Select Site --</option>
              {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label="Job Role">
            <Input name="jobRole" value={form.jobRole} onChange={handleChange} placeholder="e.g. Mason, Carpenter, Helper" />
          </FormField>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button type="submit" disabled={loading} variant="primary">
              {loading ? 'Enrolling...' : '✔ Enroll Worker'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/workers')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default WorkerEnrollment;
