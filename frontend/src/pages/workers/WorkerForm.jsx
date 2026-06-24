import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, TextField, Button, MenuItem, Alert, Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const WorkerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    nrc: '',
    phone: '',
    dailyRate: '',
    site: '',
    status: 'active',
  });
  const [enroller, setEnroller] = useState(null);
  const [message, setMessage] = useState(null);

  // ✅ Allow: admin, director, civil-engineer, foreman, accountant, qs, quantity-surveyor
  const canEditWorker = ['admin', 'director', 'civil-engineer', 'foreman', 'accountant', 'qs', 'quantity-surveyor'].includes(user?.role);

  useEffect(() => {
    if (id) {
      api.get(`/api/workers/${id}`)
        .then(res => {
          const data = res.data;
          setForm({
            name: data.name || '',
            nrc: data.nrc || '',
            phone: data.phone || '',
            dailyRate: data.dailyRate || '',
            site: data.site || '',
            status: data.status || 'active',
          });
          setEnroller(data.enrolledBy);
        })
        .catch(err => {
          setMessage({ type: 'error', text: 'Failed to load worker' });
        });
    } else {
      if (!canEditWorker) {
        navigate('/workers');
        return;
      }
      setEnroller(user);
    }
  }, [id, user, canEditWorker, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEditWorker) return;
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        name: form.name,
        nrc: form.nrc,
        phone: form.phone || '',
        dailyRate: parseFloat(form.dailyRate) || 0,
        site: form.site || '',
        status: form.status,
      };
      if (id) {
        await api.put(`/api/workers/${id}`, payload);
        setMessage({ type: 'success', text: 'Worker updated successfully!' });
      } else {
        await api.post('/api/workers', payload);
        setMessage({ type: 'success', text: 'Worker enrolled successfully!' });
      }
      setTimeout(() => navigate('/workers'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save worker' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <Paper sx={{ p: 3, maxWidth: '700px', mx: 'auto' }}>
      <BackButton />
      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      {!canEditWorker && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have view‑only access. Edits are disabled.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Header */}
        <Box sx={{
          textAlign: 'center',
          borderBottom: '2px solid #000',
          pb: 2,
          mb: 2,
        }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: 2 }}>PURVEYOLS</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Building and Civil Construction</Typography>
          <Typography variant="body2">Plot No. 8, Buchi Road - Northmead, P.O. Box NH 87 Lusaka, Zambia</Typography>
          <Typography variant="body2">Tel: +260 211 235354 | Mobile: +260 977 393879 / +260 965 393879</Typography>
          <Typography variant="body2">Email: purveyols@gmail.com</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {id ? 'EDIT WORKER' : 'ENROLL WORKER'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {id ? `Worker ID: ${id}` : 'New Worker'}
          </Typography>
        </Box>

        {enroller && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enrolled by (you): <strong>{enroller.name}</strong> ({enroller.role})
          </Typography>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Full Name *"
              fullWidth
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Enter worker's full name..."
              disabled={!canEditWorker}
              InputProps={{ readOnly: !canEditWorker }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="NRC Number *"
              fullWidth
              value={form.nrc}
              onChange={e => setForm({ ...form, nrc: e.target.value })}
              required
              placeholder="e.g., 123456/78/9"
              disabled={!canEditWorker}
              InputProps={{ readOnly: !canEditWorker }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Phone Number"
              fullWidth
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g., +260 97 1234567"
              disabled={!canEditWorker}
              InputProps={{ readOnly: !canEditWorker }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Daily Rate (ZMW)"
              type="number"
              fullWidth
              value={form.dailyRate}
              onChange={e => setForm({ ...form, dailyRate: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
              placeholder="0.00"
              disabled={!canEditWorker}
              InputProps={{ readOnly: !canEditWorker }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Site / Location"
              fullWidth
              value={form.site}
              onChange={e => setForm({ ...form, site: e.target.value })}
              placeholder="e.g., Lusaka, Site A"
              disabled={!canEditWorker}
              InputProps={{ readOnly: !canEditWorker }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              label="Status"
              fullWidth
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              disabled={!canEditWorker}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* Approval / Signature Section */}
        <Box sx={{ mt: 4, borderTop: '1px solid #000', pt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Approval</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Enrolled by:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{enroller?.name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Date:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {new Date().toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Typography variant="body2">Verified by: _________________</Typography>
            <Typography variant="body2">Date: _________________</Typography>
          </Box>
        </Box>

        {/* Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          {canEditWorker && (
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
              {loading ? 'Saving...' : 'Save Worker'}
            </Button>
          )}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          <Button variant="outlined" onClick={() => navigate('/workers')}>Cancel</Button>
        </Box>
      </form>
    </Paper>
  );
};

export default WorkerForm;