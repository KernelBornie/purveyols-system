import React, { useState, useEffect } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography,
  IconButton, Tooltip, Box
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import BackButton from '../../components/BackButton';

const DeliveryNoteList = () => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    api.get('/api/delivery')
      .then(res => setNotes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNotes([]));
  }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Delivery Notes</Typography>
        <Button component={Link} to="/delivery/new" variant="contained" startIcon={<AddIcon />}>
          New Delivery Note
        </Button>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>No.</TableCell>
            <TableCell>M/S</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {notes.map(n => (
            <TableRow key={n._id}>
              <TableCell>{n.noteNumber}</TableCell>
              <TableCell>{n.ms || '-'}</TableCell>
              <TableCell>{new Date(n.date).toLocaleDateString()}</TableCell>
              <TableCell>{n.items?.length || 0}</TableCell>
              <TableCell>
                <Tooltip title="View/Edit">
                  <IconButton component={Link} to={`/delivery/${n._id}`} size="small">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Print">
                  <IconButton size="small" onClick={() => window.print()}>
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default DeliveryNoteList;
