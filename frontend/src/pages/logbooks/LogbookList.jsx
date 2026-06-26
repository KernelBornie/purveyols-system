import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, CircularProgress, Alert, IconButton, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../api/axios';
import BackButton from '../../components/BackButton';

const LogbookList = () => {
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLogbooks();
  }, []);

  const fetchLogbooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/logbooks');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setLogbooks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load logbooks');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon fontSize="small" />;
    if (mimeType === 'application/pdf') return <PictureAsPdfIcon fontSize="small" />;
    return <AttachFileIcon fontSize="small" />;
  };

  const viewFile = (logbook) => {
    if (!logbook.fileData) return;
    const url = `data:${logbook.fileType};base64,${logbook.fileData}`;
    window.open(url, '_blank');
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Logbook Entries</Typography>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchLogbooks}>
          Refresh
        </Button>
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>Vehicle</TableCell>
            <TableCell>Route</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Distance (km)</TableCell>
            <TableCell>Fuel Used (L)</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Attachment</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logbooks.map((l) => (
            <TableRow key={l._id}>
              <TableCell>{l.vehicle}</TableCell>
              <TableCell>{l.route}</TableCell>
              <TableCell>{l.createdBy?.name || 'N/A'}</TableCell>
              <TableCell>{new Date(l.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>{l.distance || '—'}</TableCell>
              <TableCell>{l.fuelUsed || '—'}</TableCell>
              <TableCell>
                <Chip
                  label={l.status}
                  size="small"
                  color={l.status === 'completed' ? 'success' : 'warning'}
                />
              </TableCell>
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
              <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="textSecondary">No logbook entries yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default LogbookList;