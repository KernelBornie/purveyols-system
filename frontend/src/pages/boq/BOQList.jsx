import React, { useState, useEffect } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, Button, Paper, Typography,
  Chip, IconButton, Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import BackButton from '../../components/BackButton';

const BOQList = () => {
  const [boqs, setBoqs] = useState([]);

  useEffect(() => {
    api.get('/api/boq').then(res => setBoqs(res.data));
  }, []);

  const getStatusColor = (status) => {
    if (status === 'approved') return 'success';
    if (status === 'submitted') return 'warning';
    return 'default';
  };

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Typography variant="h5" gutterBottom>Bills of Quantities (BOQ)</Typography>
      <Button component={Link} to="/boq/new" variant="contained" sx={{ mb: 2 }}>Create BOQ</Button>
      
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Project</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Grand Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created By</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {boqs.map(b => (
            <TableRow key={b._id}>
              <TableCell>{b.project?.name}</TableCell>
              <TableCell>{b.description || '-'}</TableCell>
              <TableCell>{b.items?.length || 0}</TableCell>
              <TableCell>ZMW {(b.grandTotal || 0).toLocaleString()}</TableCell>
              <TableCell>
                <Chip label={b.status} size="small" color={getStatusColor(b.status)} />
              </TableCell>
              <TableCell>{b.createdBy?.name}</TableCell>
              <TableCell>
                <Tooltip title="View/Edit">
                  <IconButton component={Link} to={`/boq/${b._id}`} size="small">
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

export default BOQList;
