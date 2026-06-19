import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, CircularProgress, Alert, TextField,
  FormControlLabel, Switch, Dialog, DialogTitle,
  DialogContent, DialogActions, Skeleton
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import api from '../../api/axios';
import WorkerSearch from '../../components/WorkerSearch';
import PaymentModal from '../../components/PaymentModal';
import DeliveryNote from '../../components/DeliveryNote';  // <-- added

// ... rest of the file remains unchanged up to the return ...

// Inside the return, after the header Box, add <DeliveryNote />
// I'll show the relevant part:

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Accountant Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={<Switch checked={showCharts} onChange={(e) => setShowCharts(e.target.checked)} />}
            label="Show Charts"
          />
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => fetchDashboardData(true)}>
            Refresh
          </Button>
        </Box>
      </Box>

      <DeliveryNote />   {/* <-- added */}

      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {/* ... rest of the component ... */}
    </Box>
  );
