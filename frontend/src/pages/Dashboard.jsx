import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DirectorDashboard from './dashboards/DirectorDashboard';
import AccountantDashboard from './dashboards/AccountantDashboard';
import EngineerDashboard from './dashboards/EngineerDashboard';
import ForemanDashboard from './dashboards/ForemanDashboard';
import DriverDashboard from './dashboards/DriverDashboard';
import ProcurementDashboard from './dashboards/ProcurementDashboard';
import SafetyDashboard from './dashboards/SafetyDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import SurveyorDashboard from './dashboards/SurveyorDashboard';

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  switch (user?.role?.toLowerCase().trim()) {
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
    case 'admin':
      return <AdminDashboard />;
    case 'surveyor':
      return <SurveyorDashboard />;
    default:
      return (
        <div className="card">
          <h2>Welcome to BuildSync CMS</h2>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Your role: <strong>{user?.role || 'unknown'}</strong>. Contact your administrator if you need access.
          </p>
        </div>
      );
  }
}