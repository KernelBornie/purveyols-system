import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const EngineerDashboard = () => {
  const actions = [
    { label: 'Enroll Worker', path: '/workers/new' },
    { label: 'Create Project', path: '/projects/new' },
    { label: 'Create Procurement Order', path: '/procurement/new' },
    { label: 'Request Funding', path: '/funding/new' },
    { label: 'Subcontract', path: '/subcontracts/new' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Civil Engineer Dashboard</Typography>
      <Typography variant="subtitle1" gutterBottom>Technical Design & Site Supervision</Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {actions.map((action, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card>
              <CardContent>
                <Button
                  component={Link}
                  to={action.path}
                  variant="contained"
                  fullWidth
                >
                  {action.label}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default EngineerDashboard;
