import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Grid, Card, CardContent, Chip, Alert
} from '@mui/material';
import api from '../api/axios';

const ReportModal = ({ open, onClose }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/reports/accountant/stats?startDate=${startDate}&endDate=${endDate}`);
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Generate Custom Report</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            fullWidth
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={generateReport} disabled={loading}>
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {report && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Report Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card><CardContent><Typography variant="body2">Workers</Typography><Typography variant="h6">{report.workers}</Typography></CardContent></Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card><CardContent><Typography variant="body2">Projects</Typography><Typography variant="h6">{report.projects}</Typography></CardContent></Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card><CardContent><Typography variant="body2">Payments</Typography><Typography variant="h6">{report.payments}</Typography></CardContent></Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card><CardContent><Typography variant="body2">Total Released</Typography><Typography variant="h6">ZMW {report.totalReleased?.toFixed(2) || '0.00'}</Typography></CardContent></Card>
              </Grid>
            </Grid>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Pending: {report.pendingFunding || 0} funding, {report.pendingBOQs || 0} BOQs
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportModal;
