import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, CircularProgress, Alert, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const TenderList = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const canEdit = ['admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor'].includes(user?.role);
  const canDelete = ['admin', 'director'].includes(user?.role);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/tenders');
      setTenders(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load tenders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tender?')) return;
    try {
      await api.delete(`/api/tenders/${id}`);
      fetchTenders();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'submitted': return 'warning';
      case 'under_review': return 'info';
      case 'awarded': return 'success';
      case 'rejected': return 'error';
      case 'not_awarded': return 'default';
      default: return 'default';
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      solicitation: 'Solicitation',
      rfq: 'RFQ',
      tender: 'Tender',
      proposal: 'Proposal',
      bid: 'Bid',
    };
    return map[type] || type;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 2 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Tenders & RFQs</Typography>
        {canEdit && (
          <Button component={Link} to="/tenders/new" variant="contained" startIcon={<AddIcon />}>
            New Tender / RFQ
          </Button>
        )}
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>Reference</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Client</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Grand Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created By</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tenders.map((t) => (
            <TableRow key={t._id}>
              <TableCell>{t.referenceNumber}</TableCell>
              <TableCell>{t.title}</TableCell>
              <TableCell><Chip label={getTypeLabel(t.type)} size="small" color="primary" /></TableCell>
              <TableCell>{t.client}</TableCell>
              <TableCell>{t.sections?.reduce((sum, s) => sum + (s.items?.length || 0), 0) || 0}</TableCell>
              <TableCell>{formatCurrency(t.priceProposal?.grandTotal || 0)}</TableCell>
              <TableCell>
                <Chip label={t.status} size="small" color={getStatusColor(t.status)} />
              </TableCell>
              <TableCell>{t.createdBy?.name}</TableCell>
              <TableCell>
                <Button
                  component={Link}
                  to={`/tenders/${t._id}`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 0.5, textTransform: 'none' }}
                >
                  View
                </Button>
                {canEdit && t.status !== 'submitted' && t.status !== 'awarded' && (
                  <Tooltip title="Edit">
                    <IconButton
                      component={Link}
                      to={`/tenders/${t._id}/edit`}
                      size="small"
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {canDelete && t.status !== 'awarded' && (
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(t._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
          {tenders.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="textSecondary">No tenders or RFQs yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default TenderList;