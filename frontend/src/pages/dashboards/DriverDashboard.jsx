import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DeliveryNote from "../../components/DeliveryNote";
import {
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, IconButton, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../api/axios';

const COLORS = ['#4caf50', '#ff9800', '#2196f3', '#f44336'];

const DriverDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [logbooks, setLogbooks] = useState([]);
  const [procurementOrders, setProcurementOrders] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0 });
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    vehicle: '', route: '', startTime: '', endTime: '',
    distance: '', fuelUsed: '', notes: '', file: null,
  });
  const [message, setMessage] = useState(null);
  const [weeklyTrips, setWeeklyTrips] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const logRes = await api.get('/api/logbooks');
      let logData = [];
      if (Array.isArray(logRes.data)) logData = logRes.data;
      else if (logRes.data?.data && Array.isArray(logRes.data.data)) logData = logRes.data.data;
      setLogbooks(logData);

      const procRes = await api.get('/api/procurement');
      let procData = [];
      if (Array.isArray(procRes.data)) procData = procRes.data;
      else if (procRes.data?.data && Array.isArray(procRes.data.data)) procData = procRes.data.data;
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        procData = procData.filter(p => p.createdBy?._id === user.id);
      }
      setProcurementOrders(procData);

      const fundRes = await api.get('/api/funding-requests');
      let fundData = [];
      if (Array.isArray(fundRes.data)) fundData = fundRes.data;
      else if (fundRes.data?.data && Array.isArray(fundRes.data.data)) fundData = fundRes.data.data;
      if (user.id) {
        fundData = fundData.filter(f => f.requestedBy?._id === user.id);
      }
      setFundingRequests(fundData);

      const total = logData.length;
      const completed = logData.filter(l => l.status === 'completed').length;
      const inProgress = logData.filter(l => l.status === 'in-progress').length;
      setStats({ total, completed, inProgress });

      // ─── Weekly trips (last 7 days) ──────────────────────────────
      const weekDays = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        weekDays[key] = 0;
      }
      logData.forEach(l => {
        if (l.createdAt) {
          const date = new Date(l.createdAt).toISOString().split('T')[0];
          if (weekDays[date] !== undefined) weekDays[date]++;
        }
      });
      const weeklyData = Object.entries(weekDays).map(([date, count]) => ({
        date: date.slice(5), // MM-DD
        trips: count,
      }));
      setWeeklyTrips(weeklyData);

    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (let key in form) {
      if (key === 'file') {
        if (form.file) formData.append('file', form.file);
      } else {
        formData.append(key, form[key]);
      }
    }
    try {
      await api.post('/api/logbooks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: 'Logbook submitted' });
      setOpenModal(false);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Submission failed' });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setForm({ ...form, file });
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon />;
    if (mimeType === 'application/pdf') return <PictureAsPdfIcon />;
    return <AttachFileIcon />;
  };

  const viewFile = (logbook) => {
    if (!logbook.fileData) return;
    const url = `data:${logbook.fileType};base64,${logbook.fileData}`;
    window.open(url, '_blank');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  // ─── Trip status data for pie chart ──────────────────────────────
  const tripStatusData = [
    { name: 'Completed', value: stats.completed },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Pending', value: stats.total - stats.completed - stats.inProgress },
  ].filter(d => d.value > 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Driver Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
          Refresh
        </Button>
      </Box>

      <DeliveryNote />

      <Typography variant="subtitle1" gutterBottom>Transport & Logistics</Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Quick Actions</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Button component={Link} to="/spare-parts/new" variant="contained" fullWidth>
              Request Spare Parts
            </Button>
            <Typography variant="caption" color="textSecondary">
              Submit a spare parts request (procurement will handle pricing)
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button component={Link} to="/funding/new" variant="contained" fullWidth>
              Request Funds
            </Button>
            <Typography variant="caption" color="textSecondary">
              For lunch, lodge, spare parts, etc.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button variant="contained" color="primary" onClick={() => setOpenModal(true)} fullWidth>
              New Logbook
            </Button>
            <Typography variant="caption" color="textSecondary">
              Record trip and upload logbook
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {loading ? <CircularProgress /> : (
        <>
          {/* ─── Professional Stats Cards ─────────────────────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Trips</Typography>
                  <Typography variant="h3">{stats.total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">Completed</Typography>
                  <Typography variant="h4" color="#4caf50">{stats.completed}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">In Progress</Typography>
                  <Typography variant="h4" color="#ff9800">{stats.inProgress}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ─── Charts ─────────────────────────────────────────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Trip Status Distribution</Typography>
                {tripStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={tripStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {tripStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value} trips`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 6 }}>
                    No trip data available.
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Weekly Trips</Typography>
                {weeklyTrips.length > 0 && weeklyTrips.some(d => d.trips > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyTrips}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip formatter={(value) => `${value} trips`} />
                      <Legend />
                      <Bar dataKey="trips" fill="#8884d8" name="Trips" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 6 }}>
                    No trips recorded this week.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* ─── Tables ─────────────────────────────────────────────────── */}
          <Grid container spacing={3}>
            {/* Logbook Entries */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">Logbook Entries</Typography>
                  <Button component={Link} to="/logbooks" size="small">View All</Button>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Route</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Attachment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logbooks.slice(0, 5).map(l => (
                      <TableRow key={l._id}>
                        <TableCell>{l.vehicle}</TableCell>
                        <TableCell>{l.route}</TableCell>
                        <TableCell><Chip label={l.status} color={l.status === 'completed' ? 'success' : 'warning'} size="small" /></TableCell>
                        <TableCell>
                          {l.fileData ? (
                            <Tooltip title="View Attachment">
                              <IconButton size="small" onClick={() => viewFile(l)}>
                                {getFileIcon(l.fileType)}
                              </IconButton>
                            </Tooltip>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {logbooks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No logbook entries.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            {/* Funding Requests */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">My Funding Requests</Typography>
                  <Button component={Link} to="/funding" size="small">View All</Button>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fundingRequests.slice(0, 5).map(f => (
                      <TableRow key={f._id}>
                        <TableCell>{f.description}</TableCell>
                        <TableCell>{formatCurrency(f.amount)}</TableCell>
                        <TableCell><Chip label={f.status} color={f.status === 'approved' ? 'success' : f.status === 'rejected' ? 'error' : 'warning'} size="small" /></TableCell>
                      </TableRow>
                    ))}
                    {fundingRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">No funding requests.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            {/* Procurement Orders (Spare Parts) */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">My Spare Parts Requests</Typography>
                  <Button component={Link} to="/spare-parts" size="small">View All</Button>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Requested By</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {procurementOrders.slice(0, 5).map(p => (
                      <TableRow key={p._id}>
                        <TableCell>{p.items?.length > 0 ? p.items.map(i => i.name || i.description).join(', ') : 'N/A'}</TableCell>
                        <TableCell>{p.items?.length || 0}</TableCell>
                        <TableCell><Chip label={p.status} color={p.status === 'funded' ? 'success' : p.status === 'purchased' ? 'info' : 'warning'} size="small" /></TableCell>
                        <TableCell>{p.createdBy?.name || 'N/A'}</TableCell>
                        <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                    {procurementOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No spare parts requests.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* New Logbook Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Logbook Entry</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label="Vehicle" fullWidth margin="normal"
              value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})}
              required
            />
            <TextField
              label="Route" fullWidth margin="normal"
              value={form.route} onChange={e => setForm({...form, route: e.target.value})}
              required
            />
            <TextField
              label="Start Time" type="datetime-local" fullWidth margin="normal"
              value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Time" type="datetime-local" fullWidth margin="normal"
              value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Distance (km)" type="number" fullWidth margin="normal"
              value={form.distance} onChange={e => setForm({...form, distance: e.target.value})}
            />
            <TextField
              label="Fuel Used (L)" type="number" fullWidth margin="normal"
              value={form.fuelUsed} onChange={e => setForm({...form, fuelUsed: e.target.value})}
            />
            <TextField
              label="Notes" fullWidth margin="normal" multiline rows={2}
              value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
            />
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" component="label">
                Upload Logbook (Image/PDF)
                <input type="file" hidden accept="image/*,application/pdf" onChange={handleFileChange} />
              </Button>
              {form.file && <Typography variant="caption" sx={{ ml: 2 }}>{form.file.name}</Typography>}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Submit</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DriverDashboard;