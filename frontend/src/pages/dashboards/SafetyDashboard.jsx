import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../api/axios';

const COLORS = ['#4caf50', '#f44336', '#ff9800', '#2196f3'];

const SafetyDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState([]);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, pending: 0 });
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({ site: '', date: '', findings: '', status: 'pending' });
  const [message, setMessage] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/safety-reports');
      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (res.data && typeof res.data === 'object' && Array.isArray(res.data.data)) data = res.data.data;
      else data = [];
      setInspections(data);
      const total = data.length;
      const passed = data.filter(i => i.status === 'passed').length;
      const failed = data.filter(i => i.status === 'failed').length;
      const pending = data.filter(i => i.status === 'pending' || i.status === 'submitted').length;
      setStats({ total, passed, failed, pending });

      // ─── Weekly trend (last 7 days) ──────────────────────────────
      const days = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        days[key] = 0;
      }
      data.forEach(insp => {
        if (insp.date) {
          const date = new Date(insp.date).toISOString().split('T')[0];
          if (days[date] !== undefined) days[date]++;
        }
      });
      const trendData = Object.entries(days).map(([date, count]) => ({
        date: date.slice(5), // MM-DD
        inspections: count,
      }));
      setWeeklyTrend(trendData);

    } catch (err) {
      console.error(err);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/safety-reports', form);
      setMessage({ type: 'success', text: 'Inspection report submitted' });
      setOpenModal(false);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Submission failed' });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // ─── Status pie chart data ──────────────────────────────────────
  const statusData = [
    { name: 'Passed', value: stats.passed },
    { name: 'Failed', value: stats.failed },
    { name: 'Pending', value: stats.pending },
  ].filter(d => d.value > 0);

  const quickActions = [
    { label: 'Create Procurement Order', path: '/procurement/new' },
    { label: 'Request Funding', path: '/funding/new' },
    { label: 'New Inspection', action: 'modal' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Safety Dashboard</Typography>
        <Box>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData} sx={{ mr: 1 }}>
            Refresh
          </Button>
          <Button variant="contained" color="primary" onClick={() => setOpenModal(true)}>
            New Inspection
          </Button>
        </Box>
      </Box>

      <DeliveryNote />

      <Typography variant="subtitle1" gutterBottom>Workplace Safety & Compliance</Typography>

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
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Inspections</Typography>
                  <Typography variant="h3">{stats.total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Passed</Typography>
                  <Typography variant="h4" color="#4caf50">{stats.passed}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #f44336' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Failed</Typography>
                  <Typography variant="h4" color="#f44336">{stats.failed}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Pending</Typography>
                  <Typography variant="h4" color="#ff9800">{stats.pending}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ─── Charts ─────────────────────────────────────────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Inspection Status</Typography>
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
                      <RechartsTooltip formatter={(value) => `${value} inspections`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 6 }}>
                    No inspection data available.
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Weekly Inspections</Typography>
                {weeklyTrend.some(d => d.inspections > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip formatter={(value) => `${value} inspections`} />
                      <Legend />
                      <Bar dataKey="inspections" fill="#8884d8" name="Inspections" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 6 }}>
                    No inspections recorded this week.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* ─── Quick Actions ─────────────────────────────────────────── */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  {action.path ? (
                    <Button component={Link} to={action.path} variant="contained" fullWidth>
                      {action.label}
                    </Button>
                  ) : (
                    <Button variant="contained" fullWidth onClick={() => setOpenModal(true)}>
                      {action.label}
                    </Button>
                  )}
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* ─── Inspection Reports Table ────────────────────────────── */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Inspection Reports</Typography>
              <Button component={Link} to="/safety-reports" size="small">View All</Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Site</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Findings</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inspections.slice(0, 5).map(i => (
                  <TableRow key={i._id}>
                    <TableCell>{i.site}</TableCell>
                    <TableCell>{formatDate(i.date)}</TableCell>
                    <TableCell>{i.findings}</TableCell>
                    <TableCell>
                      <Chip
                        label={i.status}
                        color={i.status === 'passed' ? 'success' : i.status === 'failed' ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        component={Link}
                        to={`/safety-reports/${i._id}`}
                        size="small"
                        variant="outlined"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {inspections.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No inspection reports yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      {/* New Inspection Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Safety Inspection</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label="Site"
              fullWidth
              margin="normal"
              value={form.site}
              onChange={e => setForm({ ...form, site: e.target.value })}
              required
            />
            <TextField
              label="Date"
              type="date"
              fullWidth
              margin="normal"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Findings / Observations"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={form.findings}
              onChange={e => setForm({ ...form, findings: e.target.value })}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Submit Report</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default SafetyDashboard;