import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';

const DrawingList = () => {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/api/drawings');
      setDrawings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this drawing?')) return;
    try {
      await api.delete(`/api/drawings/${id}`);
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'issued': return 'info';
      case 'as_built': return 'primary';
      case 'submitted': return 'warning';
      case 'checked': return 'info';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      site_plan: 'Site Plan',
      building_plan: 'Building Plan',
      floor_plan: 'Floor Plan',
      foundation_plan: 'Foundation Plan',
      fence_plan: 'Fence Plan',
      road_design: 'Road Design',
      drainage: 'Drainage',
      access_control: 'Access Control',
      electrical: 'Electrical Layout',
      water_reticulation: 'Water Reticulation',
      topographic: 'Topographic Survey',
    };
    return map[type] || type;
  };

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Drawings & Designs
        </Typography>
        <Button
          component={Link}
          to="/drawings/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          New Drawing
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Revision</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Preview</TableCell>
              <TableCell>Designer</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drawings.map((drawing) => (
              <TableRow key={drawing._id}>
                <TableCell>{drawing.name}</TableCell>
                <TableCell>{getTypeLabel(drawing.type)}</TableCell>
                <TableCell>{drawing.project?.name || 'N/A'}</TableCell>
                <TableCell>v{drawing.revisionNumber}</TableCell>
                <TableCell>
                  <Chip label={drawing.status} color={getStatusColor(drawing.status)} size="small" />
                </TableCell>
                <TableCell>
                  {drawing.previewImage ? (
                    <img
                      src={drawing.previewImage}
                      alt={drawing.name}
                      style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }}
                    />
                  ) : (
                    <DescriptionIcon color="disabled" />
                  )}
                </TableCell>
                <TableCell>{drawing.designer?.name || '—'}</TableCell>
                <TableCell>
                  {/* ─── View button (text) ──────────────────────────── */}
                  <Button
                    component={Link}
                    to={`/drawings/${drawing._id}`}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 0.5, minWidth: '40px', textTransform: 'none' }}
                  >
                    View
                  </Button>

                  <Tooltip title="Edit">
                    <IconButton
                      component={Link}
                      to={`/drawings/${drawing._id}/edit`}
                      size="small"
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(drawing._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {drawings.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    No drawings yet. Click "New Drawing" to start.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
};

export default DrawingList;