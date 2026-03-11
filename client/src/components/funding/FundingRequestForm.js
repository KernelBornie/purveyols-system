import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card, { FormField, Input, Select, Button, Alert } from '../shared/UI';

const SITES = ['Site A', 'Site B', 'Site C', 'Site D', 'Main Office'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const FundingRequestForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', amount: '', site: '', priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/funding-requests', { ...form, amount: Number(form.amount) });
      setSuccess('Funding request submitted successfully!');
      setTimeout(() => navigate('/funding-requests'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
        <h2 style={{ margin: 0 }}>📋 Request Funding</h2>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <Card>
        <form onSubmit={handleSubmit}>
          <FormField label="Title" required>
            <Input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Materials for Block B foundation" required />
          </FormField>
          <FormField label="Description" required>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Detailed description of the funding need..."
              required
              rows={4}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </FormField>
          <FormField label="Amount Required (ZMW)" required>
            <Input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="0.00" min="0" required />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Site">
              <Select name="site" value={form.site} onChange={handleChange}>
                <option value="">-- Site (Optional) --</option>
                {SITES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Priority">
              <Select name="priority" value={form.priority} onChange={handleChange}>
                {PRIORITIES.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </Select>
            </FormField>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button type="submit" disabled={loading} variant="primary">
              {loading ? 'Submitting...' : '📋 Submit Request'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/funding-requests')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FundingRequestForm;
