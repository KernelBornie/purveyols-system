import DashboardActions from '../../components/DashboardActions';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/axios';
import DeliveryNote from '../../components/DeliveryNote';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ users: 0, roles: {} });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users');
      setUsers(res.data);
      const roles = {};
      res.data.forEach(u => {
        roles[u.role] = (roles[u.role] || 0) + 1;
      });
      setStats({ users: res.data.length, roles });
    } catch (err) {
      console.error(err);
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
        <Typography variant="h4">Admin Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
          Refresh
        </Button>
      </Box>

      <DeliveryNote />

      <Typography variant="subtitle1" gutterBottom>System Administration</Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Total Users</Typography>
                <Typography variant="h4">{stats.users}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Roles</Typography>
                <Box>
                  {Object.entries(stats.roles).map(([role, count]) => (
                    <Typography key={role} variant="body2">{role}: {count}</Typography>
                  ))}
                </Box>
              </CardContent></Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>All Users</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Phone</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u._id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Chip label={u.role} size="small" /></TableCell>
                    <TableCell>{u.phone || '—'}</TableCell>
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

export default AdminDashboard;
