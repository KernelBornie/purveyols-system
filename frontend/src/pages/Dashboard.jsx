// src/pages/Dashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Typography } from '@mui/material';

// Import all role-specific dashboards
import EngineerDashboard from './dashboards/EngineerDashboard';
import AccountantDashboard from './dashboards/AccountantDashboard';
import DirectorDashboard from './dashboards/DirectorDashboard';
import ForemanDashboard from './dashboards/ForemanDashboard';
import ProcurementDashboard from './dashboards/ProcurementDashboard';
import SafetyDashboard from './dashboards/SafetyDashboard';
import DriverDashboard from './dashboards/DriverDashboard';
import ReceptionistDashboard from './dashboards/ReceptionistDashboard';
import QuantitySurveyorDashboard from './dashboards/QuantitySurveyorDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  if (!user) return <Typography>Loading...</Typography>;

  // Map roles to their dashboard components
  const roleMap = {
    'civil-engineer': EngineerDashboard,
    'quantity-surveyor': QuantitySurveyorDashboard,
    'foreman': ForemanDashboard,
    'accountant': AccountantDashboard,
    'director': DirectorDashboard,
    'procurement-officer': ProcurementDashboard,
    'safety-officer': SafetyDashboard,
    'driver': DriverDashboard,
    'receptionist': ReceptionistDashboard,
    'admin': AdminDashboard,
  };

  const DashboardComponent = roleMap[user.role];

  if (!DashboardComponent) {
    return (
      <Typography variant="h6" color="error">
        No dashboard available for role: {user.role}
      </Typography>
    );
  }

  return (
    <Box>
      <DashboardComponent />
    </Box>
  );
};

export default Dashboard;