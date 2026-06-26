import React, { useState, useEffect } from 'react';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    users: 0,
    roles: {},
    visitors: 0,
    todayVisitors: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, visitorsRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/visitors'),
      ]);
      setUsers(usersRes.data);
      const roles = {};
      usersRes.data.forEach(u => {
        roles[u.role] = (roles[u.role] || 0) + 1;
      });
      const visitorsData = Array.isArray(visitorsRes.data) ? visitorsRes.data : [];
      const totalVisitors = visitorsData.length;
      const todayVisitors = visitorsData.filter(v => new Date(v.checkIn).toDateString() === new Date().toDateString()).length;

      setStats({
        users: usersRes.data.length,
        roles,
        visitors: totalVisitors,
        todayVisitors,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── Chart data ─────────────────────────────────────────────────────
  const roleData = Object.entries(stats.roles).map(([name, value]) => ({ name, value }));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

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
          {/* ─── Professional Stats Cards (5 cards per row) ──────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Users</Typography>
                  <Typography variant="h3">{stats.users}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Active Users</Typography>
                  <Typography variant="h4" color="#4caf50">
                    {users.filter(u => u.status !== 'inactive').length}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {users.filter(u => u.status === 'inactive').length} inactive
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #2196f3' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Roles</Typography>
                  <Typography variant="h4" color="#2196f3">{Object.keys(stats.roles).length}</Typography>
                  <Typography variant="caption" color="textSecondary">different roles</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Most Common Role</Typography>
                  <Typography variant="h4" color="#ff9800">
                    {Object.entries(stats.roles).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {Object.entries(stats.roles).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #9c27b0' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Visitors</Typography>
                  <Typography variant="h4" color="#9c27b0">{stats.visitors}</Typography>
                  <Typography variant="caption" color="textSecondary">{stats.todayVisitors} today</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ─── Charts ─────────────────────────────────────────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>User Role Distribution</Typography>
                {roleData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={roleData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {roleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value} users`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 8 }}>
                    No user data available.
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Button
                      component={Link}
                      to="/users"
                      variant="contained"
                      fullWidth
                    >
                      Manage Users
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      component={Link}
                      to="/settings"
                      variant="contained"
                      fullWidth
                    >
                      System Settings
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      component={Link}
                      to="/profile"
                      variant="contained"
                      fullWidth
                    >
                      My Profile
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      component={Link}
                      to="/payment-notifications"
                      variant="contained"
                      fullWidth
                    >
                      Payment Notifications
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          {/* ─── Users Table ───────────────────────────────────────────── */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">All Users</Typography>
              <Button component={Link} to="/users" size="small">View All</Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.slice(0, 5).map(u => (
                  <TableRow key={u._id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Chip label={u.role} size="small" color="primary" /></TableCell>
                    <TableCell>{u.phone || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.status || 'active'}
                        size="small"
                        color={u.status === 'inactive' ? 'error' : 'success'}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        component={Link}
                        to={`/users/${u._id}`}
                        size="small"
                        variant="outlined"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No users found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default AdminDashboard;