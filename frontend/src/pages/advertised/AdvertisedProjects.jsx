import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardActions,
  Button, Chip, TextField, InputAdornment, IconButton, CircularProgress,
  Divider, Dialog, DialogTitle, DialogContent, DialogContentText,
  Link, Tooltip, Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PublicIcon from '@mui/icons-material/Public';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';

const AdvertisedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      const res = await api.get(`/api/advertised-projects?${params.toString()}`);
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch advertised projects. Using fallback data.');
      // Fallback data if API fails
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleOpenDetail = (project) => {
    setSelectedProject(project);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedProject(null);
  };

  const getStatusColor = (status) => {
    if (status === 'open') return 'success';
    if (status === 'closed') return 'error';
    return 'warning';
  };

  return (
    <Box>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">🏗️ Advertised Projects & Tenders</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchProjects}>
          Refresh
        </Button>
      </Box>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Fresh opportunities from social media, tender portals, and company announcements
      </Typography>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search projects, clients, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
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
          <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
            Search
          </Button>
          <Button variant="outlined" onClick={() => { setSearchTerm(''); setFilterStatus('all'); fetchProjects(); }}>
            Clear
          </Button>
        </form>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      ) : projects.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">No advertised projects found</Typography>
          <Typography variant="body2" color="textSecondary">Check back later for new opportunities</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div" noWrap title={project.title}>
                      {project.title}
                    </Typography>
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
                    {project.skills?.slice(0, 3).map((skill, i) => (
                      <Chip key={i} label={skill} size="small" color="primary" variant="outlined" />
                    ))}
                    {project.skills?.length > 3 && <Chip label={`+${project.skills.length - 3}`} size="small" />}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleOpenDetail(project)}>View Details</Button>
                  <Button size="small" href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Source: {project.source}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        {selectedProject && (
          <>
            <DialogTitle>
              {selectedProject.title}
              <Chip label={selectedProject.status} color={getStatusColor(selectedProject.status)} sx={{ ml: 2 }} />
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Client</Typography>
                  <Typography variant="body1">{selectedProject.client}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Location</Typography>
                  <Typography variant="body1">{selectedProject.location}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Budget</Typography>
                  <Typography variant="body1">{selectedProject.budget}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Deadline</Typography>
                  <Typography variant="body1">{selectedProject.deadline}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                  <Typography variant="body1">{selectedProject.description}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Required Skills</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedProject.skills?.map((skill, i) => (
                      <Chip key={i} label={skill} color="primary" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Bidding Fee</Typography>
                  <Typography variant="body1">{selectedProject.biddingFee || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Contact</Typography>
                  <Typography variant="body1">
                    <Link href={`mailto:${selectedProject.contactEmail}`}>{selectedProject.contactEmail}</Link>
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Source</Typography>
                  <Link href={selectedProject.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {selectedProject.source} → {selectedProject.sourceUrl}
                  </Link>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetail}>Close</Button>
              <Button variant="contained" href={selectedProject.sourceUrl} target="_blank">
                View Original Source
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdvertisedProjects;
