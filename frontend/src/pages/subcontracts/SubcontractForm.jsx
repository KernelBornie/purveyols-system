import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Paper, Typography, MenuItem, Box } from '@mui/material';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const SubcontractForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ project: '', vendor: '', service: '', amount: '', startDate: '', endDate: '', status: 'active' });
  const [projects, setProjects] = useState([]);
  const [creator, setCreator] = useState(null);

  useEffect(() => {
    api.get('/api/projects').then(res => setProjects(res.data));
    if (id) {
      api.get(`/api/subcontracts/${id}`).then(res => {
        setForm(res.data);
        setCreator(res.data.createdBy);
      });
    } else {
      setCreator(user);
    }
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) await api.put(`/api/subcontracts/${id}`, form);
      else await api.post('/api/subcontracts', form);
      navigate('/subcontracts');
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5">{id ? 'Edit Subcontract' : 'New Subcontract'}</Typography>
      {creator && (
        <Box sx={{ mt: 1, mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {id ? 'Created by' : 'Created by (you)'}: <strong>{creator.name}</strong> ({creator.role})
          </Typography>
        </Box>
      )}
      <form onSubmit={handleSubmit}>
        <TextField select label="Project" fullWidth margin="normal" value={form.project} onChange={e => setForm({...form, project: e.target.value})} required>
          {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
        </TextField>
        <TextField label="Vendor" fullWidth margin="normal" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} required />
        <TextField label="Service" fullWidth margin="normal" value={form.service} onChange={e => setForm({...form, service: e.target.value})} />
        <TextField label="Amount" type="number" fullWidth margin="normal" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
        <TextField label="Start Date" type="date" fullWidth margin="normal" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} InputLabelProps={{ shrink: true }} />
        <TextField label="End Date" type="date" fullWidth margin="normal" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} InputLabelProps={{ shrink: true }} />
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>Save</Button>
      </form>
    </Paper>
  );
};
export default SubcontractForm;
