import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  if (!user) return <Typography>Loading...</Typography>;

  const roleActions = {
    'civil-engineer': [
      { label: 'Workers', path: '/workers' },
      { label: 'Projects', path: '/projects' },
      { label: 'Procurement Orders', path: '/procurement' },
      { label: 'Funding Requests', path: '/funding' },
      { label: 'Subcontracts', path: '/subcontracts' },
      { label: 'BOQ', path: '/boq' },
    ],
    'quantity-surveyor': [
      { label: 'Workers', path: '/workers' },
      { label: 'Projects', path: '/projects' },
      { label: 'Procurement Orders', path: '/procurement' },
      { label: 'Funding Requests', path: '/funding' },
      { label: 'Subcontracts', path: '/subcontracts' },
      { label: 'BOQ', path: '/boq' },
    ],
    'foreman': [
      { label: 'Workers', path: '/workers' },
      { label: 'Projects', path: '/projects' },
      { label: 'Procurement Orders', path: '/procurement' },
      { label: 'Funding Requests', path: '/funding' },
      { label: 'Subcontracts', path: '/subcontracts' },
      { label: 'BOQ', path: '/boq' },
    ],
    'accountant': [
      { label: 'Funding Requests', path: '/funding' },
      { label: 'Procurement Orders', path: '/procurement' },
    ],
    'procurement-officer': [
      { label: 'Procurement Orders', path: '/procurement' },
    ],
    'director': [
      { label: 'Projects', path: '/projects' },
      { label: 'Funding Requests', path: '/funding' },
      { label: 'BOQ', path: '/boq' },
    ],
    'safety-officer': [{ label: 'Safety Reports', path: '/safety' }],
    'driver': [{ label: 'Logbooks', path: '/logbooks' }],
    'receptionist': [{ label: 'Visitors', path: '/visitors' }],
  };

  const actions = roleActions[user.role] || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Welcome, {user.name}</Typography>
      <Typography variant="subtitle1" gutterBottom>Role: {user.role}</Typography>
      <Grid container spacing={3}>
        {actions.map((action) => (
          <Grid item xs={12} sm={6} md={4} key={action.path}>
            <Card>
              <CardContent>
                <Button component={Link} to={action.path} variant="contained" fullWidth>
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
export default Dashboard;
