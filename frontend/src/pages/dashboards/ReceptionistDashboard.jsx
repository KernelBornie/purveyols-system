import DashboardActions from '../../components/DashboardActions';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import api from '../../api/axios';

const ReceptionistDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [message, setMessage] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/visitors');
      const data = Array.isArray(res.data) ? res.data : [];
      setVisitors(data);
      const total = data.length;
      const today = data.filter(v => new Date(v.checkIn).toDateString() === new Date().toDateString()).length;
      setStats({ total, today });
    } catch (err) {
      console.error(err);
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Receptionist Dashboard</Typography>
        <Box>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData} sx={{ mr: 1 }}>
            Refresh
          </Button>
          {/* ─── Log Visitor button now links to dedicated form ─── */}
          <Button
            component={Link}
            to="/visitors/new"
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
          >
            Log Visitor
          </Button>
        </Box>
      </Box>

      <DeliveryNote />

      <Typography variant="subtitle1" gutterBottom>Front Desk & Administrative Support</Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Total Visitors</Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Today's Visitors</Typography>
                <Typography variant="h4">{stats.today}</Typography>
              </CardContent></Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Visitor Log</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Purpose</TableCell>
                  <TableCell>Host</TableCell>
                  <TableCell>Check-in</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visitors.map(v => (
                  <TableRow key={v._id}>
                    <TableCell>{v.name}</TableCell>
                    <TableCell>{v.phone || '—'}</TableCell>
                    <TableCell>{v.purpose || '—'}</TableCell>
                    <TableCell>{v.host || '—'}</TableCell>
                    <TableCell>{new Date(v.checkIn).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ReceptionistDashboard;