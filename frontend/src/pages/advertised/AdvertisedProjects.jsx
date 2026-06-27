import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardActions,
  Button, Chip, TextField, InputAdornment, CircularProgress,
  Dialog, DialogTitle, DialogContent, Link, Alert, Snackbar
} from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RefreshIcon from '@mui/icons-material/Refresh';
import GavelIcon from '@mui/icons-material/Gavel';
import HistoryIcon from '@mui/icons-material/History';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';

const AdvertisedProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [fetching, setFetching] = useState(false);
  const refreshInterval = useRef(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      const res = await api.get(`/api/advertised-projects?${params.toString()}`);
      setProjects(res.data.projects || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
      setError('Failed to fetch advertised projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch fresh projects from Google News ──────────────────────
  const handleFetchProjects = async () => {
    setFetching(true);
    try {
      const res = await api.post('/api/advertised-projects/fetch');
      setSnackbar({
        open: true,
        message: `✅ ${res.data.results.added} new projects added, ${res.data.results.skipped} skipped.`,
        severity: 'success',
      });
      fetchProjects();
    } catch (err) {
      console.error('Fetch error:', err);
      setSnackbar({
        open: true,
        message: '❌ Failed to fetch projects. Please try again.',
        severity: 'error',
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    if (autoRefresh) {
      refreshInterval.current = setInterval(fetchProjects, 30000);
    }
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [autoRefresh]);

  const handleSearch = (e) => { e.preventDefault(); fetchProjects(); };
  const handleRefresh = () => { fetchProjects(); setSnackbar({ open: true, message: 'Projects refreshed!', severity: 'success' }); };

  const handleOpenDetail = (project) => { setSelectedProject(project); setDetailOpen(true); };
  const handleCloseDetail = () => { setDetailOpen(false); setSelectedProject(null); };

  const handleBid = async (projectId) => {
    try {
      const res = await api.post(`/api/advertised-projects/${projectId}/bid`);
      setSnackbar({
        open: true,
        message: res.data.message || '✅ Project marked as bidded! Check the Bidded Projects page.',
        severity: 'success'
      });
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setDetailOpen(false);
    } catch (err) {
      console.error('Bid error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to mark as bidded. Please refresh and try again.';
      setSnackbar({ open: true, message: '❌ ' + errorMsg, severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    if (status === 'open') return 'success';
    if (status === 'closed') return 'error';
    return 'warning';
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  return (
    <Box>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4">🏗️ Advertised Projects & Tenders</Typography>
          <Typography variant="caption" color="textSecondary" display="block">
            Live feed – updates every 30 seconds • {projects.length} open projects
            {lastRefresh && ` • Last refresh: ${lastRefresh.toLocaleTimeString()}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            startIcon={<HistoryIcon />}
            onClick={() => navigate('/advertised-projects/bidded')}
          >
            Bidded Projects
          </Button>
          <Button 
            variant={autoRefresh ? 'contained' : 'outlined'} 
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="small"
          >
            {autoRefresh ? '🔴 Auto-Refresh On' : '⏸️ Auto-Refresh Off'}
          </Button>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={handleRefresh}>
            Refresh Now
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<CloudDownloadIcon />}
            onClick={handleFetchProjects}
            disabled={fetching}
          >
            {fetching ? 'Fetching...' : 'Fetch New Projects'}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search projects, clients, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: '200px' }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
          <TextField
            select
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ width: '150px' }}
            SelectProps={{ native: true }}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </TextField>
          <Button type="submit" variant="contained" startIcon={<SearchIcon />}>Search</Button>
          <Button variant="outlined" onClick={() => { setSearchTerm(''); setFilterStatus('all'); fetchProjects(); }}>Clear</Button>
        </form>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button variant="contained" onClick={fetchProjects} sx={{ mt: 2 }}>Retry</Button>
        </Paper>
      ) : projects.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">No open projects available</Typography>
          <Typography variant="body2" color="textSecondary">Click "Fetch New Projects" to discover fresh opportunities from Google News.</Typography>
          <Button variant="contained" color="secondary" startIcon={<CloudDownloadIcon />} onClick={handleFetchProjects} disabled={fetching} sx={{ mt: 2 }}>
            {fetching ? 'Fetching...' : 'Fetch New Projects'}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div" noWrap title={project.title}>{project.title}</Typography>
                    <Chip label={project.status} size="small" color={getStatusColor(project.status)} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip size="small" icon={<BusinessIcon />} label={project.client} variant="outlined" />
                    <Chip size="small" icon={<LocationOnIcon />} label={project.location} variant="outlined" />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {project.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip size="small" icon={<AttachMoneyIcon />} label={project.budget} variant="outlined" />
                    <Chip size="small" icon={<CalendarTodayIcon />} label={`Deadline: ${project.deadline}`} variant="outlined" />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {project.skills?.slice(0, 3).map((skill, i) => <Chip key={i} label={skill} size="small" color="primary" variant="outlined" />)}
                    {project.skills?.length > 3 && <Chip label={`+${project.skills.length - 3}`} size="small" />}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleOpenDetail(project)}>View Details</Button>
                  <Button size="small" color="success" startIcon={<GavelIcon />} onClick={() => handleBid(project.id)}>Bid Now</Button>
                  <Button size="small" href={project.sourceUrl} target="_blank" rel="noopener noreferrer">Source</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        {selectedProject && (
          <>
            <DialogTitle>
              {selectedProject.title}
              <Chip label={selectedProject.status} color={getStatusColor(selectedProject.status)} sx={{ ml: 2 }} />
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="textSecondary">Client</Typography><Typography variant="body1">{selectedProject.client}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="textSecondary">Location</Typography><Typography variant="body1">{selectedProject.location}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="textSecondary">Budget</Typography><Typography variant="body1">{selectedProject.budget}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="textSecondary">Deadline</Typography><Typography variant="body1">{selectedProject.deadline}</Typography></Grid>
                <Grid item xs={12}><Typography variant="subtitle2" color="textSecondary">Description</Typography><Typography variant="body1">{selectedProject.description}</Typography></Grid>
                <Grid item xs={12}><Typography variant="subtitle2" color="textSecondary">Required Skills</Typography><Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{selectedProject.skills?.map((skill, i) => <Chip key={i} label={skill} color="primary" />)}</Box></Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="textSecondary">Bidding Fee</Typography><Typography variant="body1">{selectedProject.biddingFee || 'N/A'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography variant="subtitle2" color="textSecondary">Contact</Typography><Typography variant="body1"><Link href={`mailto:${selectedProject.contactEmail}`}>{selectedProject.contactEmail}</Link></Typography></Grid>
                <Grid item xs={12}><Typography variant="subtitle2" color="textSecondary">Source</Typography><Link href={selectedProject.sourceUrl} target="_blank" rel="noopener noreferrer">{selectedProject.source} → {selectedProject.sourceUrl}</Link></Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetail}>Close</Button>
              <Button variant="contained" color="success" startIcon={<GavelIcon />} onClick={() => handleBid(selectedProject.id)}>Bid Now</Button>
              <Button variant="outlined" href={selectedProject.sourceUrl} target="_blank">View Original</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdvertisedProjects;