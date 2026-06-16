import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Paper, Typography, MenuItem, Box } from '@mui/material';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', location: '', status: 'planning', budget: '', description: '' });
  const [creator, setCreator] = useState(null);

  useEffect(() => {
    if (id) {
      api.get(`/api/projects/${id}`).then(res => {
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
      if (id) await api.put(`/api/projects/${id}`, form);
      else await api.post('/api/projects', form);
      navigate('/projects');
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">{id ? 'Edit Project' : 'Create Project'}</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
      </Box>
      {creator && (
        <Box sx={{ mt: 1, mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {id ? 'Created by' : 'Created by (you)'}: <strong>{creator.name}</strong> ({creator.role})
          </Typography>
        </Box>
      )}
      <form onSubmit={handleSubmit}>
        <TextField label="Name" fullWidth margin="normal" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        <TextField label="Location" fullWidth margin="normal" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
        <TextField label="Budget" type="number" fullWidth margin="normal" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} />
        <TextField select label="Status" fullWidth margin="normal" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
          <MenuItem value="planning">Planning</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="paused">Paused</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
        </TextField>
        <TextField label="Description" fullWidth margin="normal" multiline rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>Save</Button>
      </form>
    </Paper>
  );
};
export default ProjectForm;
