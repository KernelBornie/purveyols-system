import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';

const SurveyList = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/api/surveys');
      setSurveys(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this survey?')) return;
    try {
      await api.delete(`/api/surveys/${id}`);
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'submitted': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Survey Records
        </Typography>
        <Button
          component={Link}
          to="/surveys/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          New Survey
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>Survey No.</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Surveyor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Cut/Fill (m³)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {surveys.map((s) => (
              <TableRow key={s._id}>
                <TableCell>{s.surveyNumber}</TableCell>
                <TableCell>{s.project?.name || 'N/A'}</TableCell>
                <TableCell>{new Date(s.surveyDate).toLocaleDateString()}</TableCell>
                <TableCell>{s.surveyor?.name || 'N/A'}</TableCell>
                <TableCell>
                  <Chip label={s.status} color={getStatusColor(s.status)} size="small" />
                </TableCell>
                <TableCell>
                  {s.cutVolume !== undefined && s.cutVolume > 0 ? (
                    <>
                      C: {s.cutVolume.toFixed(2)} / F: {s.fillVolume.toFixed(2)}
                    </>
                  ) : (
                    <Typography variant="caption" color="textSecondary">Not calculated</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip title="View">
                    <IconButton component={Link} to={`/surveys/${s._id}`} size="small" color="info">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton component={Link} to={`/surveys/${s._id}/edit`} size="small" color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDelete(s._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {surveys.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    No surveys yet. Click "New Survey" to start.
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

export default SurveyList;