import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardActions,
  Button, Chip, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';

const BiddedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBidded = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/advertised-projects/bidded');
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBidded();
  }, []);

  return (
    <Box>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">✅ Bidded Projects</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchBidded}>
          Refresh
        </Button>
      </Box>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Projects you have already bid on
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : projects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">No bidded projects yet</Typography>
          <Typography variant="body2" color="textSecondary">
            Projects you bid on will appear here
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderLeft: '4px solid #4caf50',
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div" noWrap title={project.title}>
                      {project.title}
                    </Typography>
                    <Chip 
                      icon={<CheckCircleIcon />} 
                      label="Bidded" 
                      size="small" 
                      color="success" 
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip size="small" icon={<BusinessIcon />} label={project.client} variant="outlined" />
                    <Chip size="small" icon={<LocationOnIcon />} label={project.location} variant="outlined" />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {project.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip size="small" icon={<AttachMoneyIcon />} label={project.budget} variant="outlined" />
                    <Chip size="small" icon={<CalendarTodayIcon />} label={`Deadline: ${project.deadline}`} variant="outlined" />
                  </Box>
                  {project.biddedAt && (
                    <Typography variant="caption" color="textSecondary">
                      Bidded on: {new Date(project.biddedAt).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default BiddedProjects;
