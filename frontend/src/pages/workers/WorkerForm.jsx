import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Paper, Typography, Box, Alert, Grid } from '@mui/material';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const WorkerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', nrc: '', phone: '', dailyRate: '', site: '' });
  const [creator, setCreator] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [checkInMsg, setCheckInMsg] = useState(null);

  useEffect(() => {
    if (id) {
      api.get(`/api/workers/${id}`).then(res => {
        const w = res.data;
        setForm({ name: w.name, nrc: w.nrc, phone: w.phone, dailyRate: w.dailyRate, site: w.site });
        setCreator(w.enrolledBy);
        // fetch attendance
        api.get(`/api/attendance/worker/${id}`).then(res2 => setAttendance(res2.data));
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

  const handleCheckIn = async () => {
    try {
      await api.post('/api/attendance', { workerId: id, site: form.site, rate: form.dailyRate });
      setCheckInMsg({ type: 'success', text: 'Check‑in recorded for today' });
      // refresh attendance
      const res = await api.get(`/api/attendance/worker/${id}`);
      setAttendance(res.data);
    } catch (err) {
      setCheckInMsg({ type: 'error', text: err.response?.data?.error || 'Check‑in failed' });
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h5">{id ? 'Worker Details' : 'Enroll Worker'}</Typography>
      {creator && (
        <Box sx={{ mt: 1, mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {id ? 'Enrolled by' : 'Enrolled by (you)'}: <strong>{creator.name}</strong> ({creator.role})
          </Typography>
        </Box>
      )}

      {checkInMsg && <Alert severity={checkInMsg.type} sx={{ mb: 2 }}>{checkInMsg.text}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Name" fullWidth required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="NRC" fullWidth required value={form.nrc} onChange={e => setForm({...form, nrc: e.target.value})} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Phone" fullWidth value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Daily Rate (ZMW)" type="number" fullWidth value={form.dailyRate} onChange={e => setForm({...form, dailyRate: e.target.value})} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Site" fullWidth value={form.site} onChange={e => setForm({...form, site: e.target.value})} />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button type="submit" variant="contained">Save</Button>
          {id && (
            <Button variant="outlined" color="success" onClick={handleCheckIn}>Check‑in Today</Button>
          )}
        </Box>
      </form>

      {id && attendance.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Attendance History</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Site</TableCell>
                <TableCell>Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendance.map(a => (
                <TableRow key={a._id}>
                  <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                  <TableCell>{a.site}</TableCell>
                  <TableCell>{a.rate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Paper>
  );
};

export default WorkerForm;
