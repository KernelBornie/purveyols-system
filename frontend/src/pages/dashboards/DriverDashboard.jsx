import DashboardActions from '../../components/DashboardActions';
import Footer from '../../components/Footer';
import React, { useState, useEffect } from 'react';
import Footer from '../../components/Footer';
import {
import Footer from '../../components/Footer';
  Box, Typography, Grid, Card, CardContent, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, IconButton, Divider
} from '@mui/material';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';
import RefreshIcon from '@mui/icons-material/Refresh';
import Footer from '../../components/Footer';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import Footer from '../../components/Footer';
import ImageIcon from '@mui/icons-material/Image';
import Footer from '../../components/Footer';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import Footer from '../../components/Footer';
import api from '../../api/axios';
import Footer from '../../components/Footer';

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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch logbooks
      const logRes = await api.get('/api/logbooks');
      let logData = [];
      if (Array.isArray(logRes.data)) logData = logRes.data;
      else if (logRes.data?.data && Array.isArray(logRes.data.data)) logData = logRes.data.data;
      setLogbooks(logData);

      // Fetch procurement orders created by this driver
      const procRes = await api.get('/api/procurement');
      let procData = [];
      if (Array.isArray(procRes.data)) procData = procRes.data;
      else if (procRes.data?.data && Array.isArray(procRes.data.data)) procData = procRes.data.data;
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        procData = procData.filter(p => p.createdBy?._id === user.id);
      }
      setProcurementOrders(procData);

      // Fetch funding requests created by this driver
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Driver Dashboard</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchData}>
          Refresh
        </Button>
      <Footer />
      </Box>
      <Typography variant="subtitle1" gutterBottom>Transport & Logistics</Typography>

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {/* Quick Actions */}
      <Paper className="dashboard-background" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Quick Actions</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Button component={Link} to="/procurement/new" variant="contained" fullWidth>
              Request Spare Parts
            </Button>
            <Typography variant="caption" color="textSecondary">
              Create procurement order (leave unit prices blank)
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
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Total Trips</Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">Completed</Typography>
                <Typography variant="h4" color="success.main">{stats.completed}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card><CardContent>
                <Typography variant="body2" color="textSecondary">In Progress</Typography>
                <Typography variant="h4" color="warning.main">{stats.inProgress}</Typography>
              </CardContent></Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Logbook Entries */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Logbook Entries</Typography>
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
                            <IconButton size="small" onClick={() => viewFile(l)}>
                              {getFileIcon(l.fileType)}
                            </IconButton>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            {/* Funding Requests */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>My Funding Requests</Typography>
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
                        <TableCell>{f.amount}</TableCell>
                        <TableCell><Chip label={f.status} color={f.status === 'approved' ? 'success' : f.status === 'rejected' ? 'error' : 'warning'} size="small" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            {/* Procurement Orders (Spare Parts) with Requested By */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>My Spare Parts Requests</Typography>
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
                        <TableCell>{p.items?.length > 0 ? p.items.map(i => i.name).join(', ') : 'N/A'}</TableCell>
                        <TableCell>{p.items?.length || 0}</TableCell>
                        <TableCell><Chip label={p.status} color={p.status === 'funded' ? 'success' : p.status === 'purchased' ? 'info' : 'warning'} size="small" /></TableCell>
                        <TableCell>{p.createdBy?.name || 'N/A'}</TableCell>
                        <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
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
      <Footer />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Submit</Button>
          </DialogActions>
        </form>
      </Dialog>
      <Footer />
    </Box>
  );
};

export default DriverDashboard;
