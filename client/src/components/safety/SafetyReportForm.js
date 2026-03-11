import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card, { FormField, Input, Select, Button, Alert } from '../shared/UI';

const SITES = ['Site A', 'Site B', 'Site C', 'Site D', 'Main Office'];
const INCIDENT_TYPES = ['near-miss', 'minor-injury', 'major-injury', 'fatality', 'property-damage', 'hazard'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

const SafetyReportForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    site: '', incidentType: '', description: '', date: new Date().toISOString().split('T')[0],
    actionTaken: '', severity: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/safety-reports', form);
      setSuccess('Safety report submitted!');
      setTimeout(() => navigate('/safety'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
        <h2 style={{ margin: 0 }}>⚠️ Safety Incident Report</h2>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Site" required>
              <Select name="site" value={form.site} onChange={handleChange} required>
                <option value="">-- Select Site --</option>
                {SITES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Date" required>
              <Input name="date" type="date" value={form.date} onChange={handleChange} required />
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Incident Type" required>
              <Select name="incidentType" value={form.incidentType} onChange={handleChange} required>
                <option value="">-- Type --</option>
                {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </Select>
            </FormField>
            <FormField label="Severity">
              <Select name="severity" value={form.severity} onChange={handleChange}>
                {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Description" required>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe what happened..." required rows={4}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }} />
          </FormField>
          <FormField label="Action Taken">
            <textarea name="actionTaken" value={form.actionTaken} onChange={handleChange} placeholder="What actions were taken immediately..." rows={3}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }} />
          </FormField>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button type="submit" disabled={loading} variant="danger">
              {loading ? 'Submitting...' : '⚠️ Submit Report'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/safety')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SafetyReportForm;
