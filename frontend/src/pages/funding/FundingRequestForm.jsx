import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Paper, Typography, MenuItem, Box } from '@mui/material';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const FundingRequestForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ project: '', amount: '', description: '' });
  const [projects, setProjects] = useState([]);
  const [creator] = useState(user);

  useEffect(() => {
    api.get('/api/projects').then(res => setProjects(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/funding-requests', form);
      navigate('/funding');
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Request Direct Funding</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
      </Box>
      {creator && (
        <Box sx={{ mt: 1, mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Requested by (you): <strong>{creator.name}</strong> ({creator.role})
          </Typography>
        </Box>
      )}
      <form onSubmit={handleSubmit}>
        <TextField select label="Project" fullWidth margin="normal" value={form.project} onChange={e => setForm({...form, project: e.target.value})} required>
          {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
        </TextField>
        <TextField label="Amount" type="number" fullWidth margin="normal" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
        <TextField label="Description" fullWidth margin="normal" multiline rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>Submit Request</Button>
      </form>
    </Paper>
  );
};
export default FundingRequestForm;
