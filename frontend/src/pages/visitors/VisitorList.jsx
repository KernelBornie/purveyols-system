import React from 'react';
import { Link } from 'react-router-dom';
import { Paper, Typography, Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BackButton from '../../components/BackButton';

const VisitorList = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <BackButton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Visitors</Typography>
        <Button component={Link} to="/visitors/new" variant="contained" startIcon={<AddIcon />}>
          New Visitor
        </Button>
      </Box>
      <Typography variant="body1" color="textSecondary">
        Visitor management module is under development. Check back soon!
      </Typography>
    </Paper>
  );
};

export default VisitorList;