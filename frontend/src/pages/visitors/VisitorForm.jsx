import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Typography, Box, Button, Alert } from '@mui/material';
import BackButton from '../../components/BackButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const VisitorForm = () => {
  const navigate = useNavigate();

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <BackButton />
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Visitor Form</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        This module is under development. The form will be available soon.
      </Alert>
      <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/visitors')}>
        Back to Visitors
      </Button>
    </Paper>
  );
};

export default VisitorForm;