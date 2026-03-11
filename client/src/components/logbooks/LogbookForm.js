import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { saveForSync } from '../../utils/indexedDB';
import Card, { FormField, Input, Button, Alert } from '../shared/UI';

const SITES = ['Site A', 'Site B', 'Site C', 'Site D', 'Main Office'];

const LogbookForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    vehicleNumber: '', date: new Date().toISOString().split('T')[0],
    timeIn: '', timeOut: '', distanceKm: '', fuelLitres: '',
    route: '', purpose: '', site: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOffline] = useState(!navigator.onLine);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isOffline) {
        await saveForSync({ type: 'CREATE_LOGBOOK', data: form });
        setSuccess('Logbook entry saved offline. Will sync when online.');
      } else {
        await api.post('/logbooks', { ...form, distanceKm: Number(form.distanceKm), fuelLitres: Number(form.fuelLitres) });
        setSuccess('Logbook entry submitted successfully!');
        setTimeout(() => navigate('/logbooks'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to submit logbook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
        <h2 style={{ margin: 0 }}>📝 Driver Logbook Entry</h2>
        {isOffline && <span style={{ background: '#fff3e0', color: '#e65100', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem' }}>OFFLINE</span>}
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Vehicle Number" required>
              <Input name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange} placeholder="e.g. ABX 123" required />
            </FormField>
            <FormField label="Date" required>
              <Input name="date" type="date" value={form.date} onChange={handleChange} required />
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Time In" required>
              <Input name="timeIn" type="time" value={form.timeIn} onChange={handleChange} required />
            </FormField>
            <FormField label="Time Out" required>
              <Input name="timeOut" type="time" value={form.timeOut} onChange={handleChange} required />
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Distance (km)" required>
              <Input name="distanceKm" type="number" value={form.distanceKm} onChange={handleChange} placeholder="0.0" min="0" step="0.1" required />
            </FormField>
            <FormField label="Fuel Used (litres)" required>
              <Input name="fuelLitres" type="number" value={form.fuelLitres} onChange={handleChange} placeholder="0.0" min="0" step="0.1" required />
            </FormField>
          </div>
          <FormField label="Route" required>
            <Input name="route" value={form.route} onChange={handleChange} placeholder="e.g. Lusaka → Site A" required />
          </FormField>
          <FormField label="Purpose" required>
            <Input name="purpose" value={form.purpose} onChange={handleChange} placeholder="e.g. Material delivery" required />
          </FormField>
          <FormField label="Site">
            <select name="site" value={form.site} onChange={handleChange} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', boxSizing: 'border-box' }}>
              <option value="">-- Select Site (Optional) --</option>
              {SITES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Notes">
            <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes..." rows={2}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }} />
          </FormField>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button type="submit" disabled={loading} variant="primary">
              {loading ? 'Submitting...' : '📝 Submit Entry'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/logbooks')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LogbookForm;
