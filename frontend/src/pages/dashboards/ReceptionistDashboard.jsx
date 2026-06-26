import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import api from '../../api/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ReceptionistDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, inside: 0, departed: 0 });
  const [dailyTrend, setDailyTrend] = useState([]);
  const [message, setMessage] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/visitors');
      const data = Array.isArray(res.data) ? res.data : [];
      setVisitors(data);
      const total = data.length;
      const today = data.filter(v => new Date(v.checkIn).toDateString() === new Date().toDateString()).length;
      const inside = data.filter(v => v.status === 'inside').length;
      const departed = data.filter(v => v.status === 'departed').length;
      setStats({ total, today, inside, departed });

      // ─── Daily trend (last 7 days) ──────────────────────────────
      const days = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        days[key] = 0;
      }
      data.forEach(v => {
        if (v.checkIn) {
          const date = new Date(v.checkIn).toISOString().split('T')[0];
          if (days[date] !== undefined) days[date]++;
        }
      });
      const trendData = Object.entries(days).map(([date, count]) => ({
        date: date.slice(5), // MM-DD
        visitors: count,
      }));
      setDailyTrend(trendData);

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

  // ─── Status pie chart data ──────────────────────────────────────
  const statusData = [
    { name: 'Inside', value: stats.inside },
    { name: 'Departed', value: stats.departed },
  ].filter(d => d.value > 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Receptionist Dashboard</Typography>
        <Box>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData} sx={{ mr: 1 }}>
            Refresh
          </Button>
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
          {/* ─── Professional Stats Cards ─────────────────────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Visitors</Typography>
                  <Typography variant="h3">{stats.total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Today's Visitors</Typography>
                  <Typography variant="h4" color="#4caf50">{stats.today}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #2196f3' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Currently Inside</Typography>
                  <Typography variant="h4" color="#2196f3">{stats.inside}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Departed</Typography>
                  <Typography variant="h4" color="#ff9800">{stats.departed}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ─── Charts ─────────────────────────────────────────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Daily Visitor Trend</Typography>
                {dailyTrend.some(d => d.visitors > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip formatter={(value) => `${value} visitors`} />
                      <Legend />
                      <Bar dataKey="visitors" fill="#8884d8" name="Visitors" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 6 }}>
                    No visitors recorded this week.
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Visitor Status</Typography>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value} visitors`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 6 }}>
                    No visitor status data.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* ─── Quick Actions ─────────────────────────────────────────── */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  component={Link}
                  to="/visitors/new"
                  variant="contained"
                  fullWidth
                  startIcon={<PersonAddIcon />}
                >
                  Log New Visitor
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  component={Link}
                  to="/visitors"
                  variant="contained"
                  fullWidth
                >
                  View All Visitors
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={fetchData}
                >
                  Refresh Data
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* ─── Visitor Log Table ────────────────────────────────────── */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Visitor Log</Typography>
              <Button component={Link} to="/visitors" size="small">View All</Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Purpose</TableCell>
                  <TableCell>Host</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Check-in</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visitors.slice(0, 5).map(v => (
                  <TableRow key={v._id}>
                    <TableCell>{v.name}</TableCell>
                    <TableCell>{v.phone || '—'}</TableCell>
                    <TableCell>{v.purpose || '—'}</TableCell>
                    <TableCell>{v.host || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={v.status || 'inside'}
                        size="small"
                        color={v.status === 'departed' ? 'default' : 'success'}
                      />
                    </TableCell>
                    <TableCell>{new Date(v.checkIn).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        component={Link}
                        to={`/visitors/${v._id}`}
                        size="small"
                        variant="outlined"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {visitors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No visitors logged yet.</TableCell>
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

export default ReceptionistDashboard;