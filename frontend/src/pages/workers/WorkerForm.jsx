import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Paper, Typography, Box, MenuItem } from '@mui/material';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const WorkerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', nrc: '', phone: '', dailyRate: '', site: '', project: '' });
  const [projects, setProjects] = useState([]);
  const [creator, setCreator] = useState(null);

  useEffect(() => {
    // Fetch projects for dropdown
    api.get('/api/projects').then(res => setProjects(res.data)).catch(err => console.log(err));
    if (id) {
      api.get(`/api/workers/${id}`).then(res => {
        setForm(res.data);
        setCreator(res.data.enrolledBy);
      });
    } else {
      setCreator(user);
    }
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) await api.put(`/api/workers/${id}`, form);
      else await api.post('/api/workers', form);
      navigate('/workers');
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5">{id ? 'Edit Worker' : 'Enroll Worker'}</Typography>
      {creator && (
        <Box sx={{ mt: 1, mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {id ? 'Enrolled by' : 'Enrolled by (you)'}: <strong>{creator.name}</strong> ({creator.role})
          </Typography>
        </Box>
      )}
      <form onSubmit={handleSubmit}>
        <TextField label="Name" fullWidth margin="normal" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        <TextField label="NRC" fullWidth margin="normal" value={form.nrc} onChange={e => setForm({...form, nrc: e.target.value})} required />
        <TextField label="Phone" fullWidth margin="normal" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
        <TextField label="Daily Rate" type="number" fullWidth margin="normal" value={form.dailyRate} onChange={e => setForm({...form, dailyRate: e.target.value})} />
        <TextField label="Site" fullWidth margin="normal" value={form.site} onChange={e => setForm({...form, site: e.target.value})} />
        <TextField
          select
          label="Project"
          fullWidth
          margin="normal"
          value={form.project || ''}
          onChange={e => setForm({...form, project: e.target.value})}
        >
          <MenuItem value="">None</MenuItem>
          {projects.map(p => (
            <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>Save</Button>
      </form>
    </Paper>
  );
};
export default WorkerForm;
