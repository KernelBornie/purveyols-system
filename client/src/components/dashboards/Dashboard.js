import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DirectorDashboard from './DirectorDashboard';
import AccountantDashboard from './AccountantDashboard';
import EngineerDashboard from './EngineerDashboard';
import ForemanDashboard from './ForemanDashboard';
import DriverDashboard from './DriverDashboard';
import ProcurementDashboard from './ProcurementDashboard';
import SafetyDashboard from './SafetyDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'director':
      return <DirectorDashboard />;
    case 'accountant':
      return <AccountantDashboard />;
    case 'engineer':
      return <EngineerDashboard />;
    case 'foreman':
      return <ForemanDashboard />;
    case 'driver':
      return <DriverDashboard />;
    case 'procurement':
      return <ProcurementDashboard />;
    case 'safety':
      return <SafetyDashboard />;
    default:
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Unknown role: {user?.role}</h2>
          <p>Please contact your administrator.</p>
        </div>
      );
  }
};

export default Dashboard;
