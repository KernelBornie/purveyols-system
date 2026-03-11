import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card, { FormField, Input, Select, Button, Alert } from '../shared/UI';

const SITES = ['Site A', 'Site B', 'Site C', 'Site D', 'Main Office'];
const UNITS = ['pieces', 'bags', 'kg', 'tonnes', 'litres', 'metres', 'cubic metres', 'sheets', 'rolls'];

const MaterialRequestForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ itemName: '', quantity: '', unit: '', estimatedCost: '', urgency: 'medium', site: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/material-requests', { ...form, quantity: Number(form.quantity), estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined });
      setSuccess('Material request submitted!');
      setTimeout(() => navigate('/materials'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
        <h2 style={{ margin: 0 }}>🔧 Request Materials</h2>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <Card>
        <form onSubmit={handleSubmit}>
          <FormField label="Item Name" required>
            <Input name="itemName" value={form.itemName} onChange={handleChange} placeholder="e.g. Portland Cement 42.5" required />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Quantity" required>
              <Input name="quantity" type="number" value={form.quantity} onChange={handleChange} placeholder="0" min="1" required />
            </FormField>
            <FormField label="Unit" required>
              <Select name="unit" value={form.unit} onChange={handleChange} required>
                <option value="">-- Unit --</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Estimated Cost (ZMW)">
            <Input name="estimatedCost" type="number" value={form.estimatedCost} onChange={handleChange} placeholder="Optional" min="0" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Site" required>
              <Select name="site" value={form.site} onChange={handleChange} required>
                <option value="">-- Select Site --</option>
                {SITES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Urgency">
              <Select name="urgency" value={form.urgency} onChange={handleChange}>
                {['low', 'medium', 'high', 'urgent'].map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Additional details..." rows={3}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }} />
          </FormField>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button type="submit" disabled={loading} variant="primary">
              {loading ? 'Submitting...' : '🔧 Submit Request'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/materials')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MaterialRequestForm;
