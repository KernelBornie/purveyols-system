import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/shared/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboards/Dashboard';
import WorkerList from './components/workers/WorkerList';
import WorkerEnrollment from './components/workers/WorkerEnrollment';
import PaymentList from './components/payments/PaymentList';
import PaymentForm from './components/payments/PaymentForm';
import FundingRequestList from './components/funding/FundingRequestList';
import FundingRequestForm from './components/funding/FundingRequestForm';
import MaterialRequestList from './components/materials/MaterialRequestList';
import MaterialRequestForm from './components/materials/MaterialRequestForm';
import LogbookList from './components/logbooks/LogbookList';
import LogbookForm from './components/logbooks/LogbookForm';
import SafetyReportList from './components/safety/SafetyReportList';
import SafetyReportForm from './components/safety/SafetyReportForm';
import Reports from './components/reports/Reports';
import { LoadingSpinner } from './components/shared/UI';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

const AppLayout = ({ children }) => (
  <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
    <Navbar />
    <main>{children}</main>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/workers" element={<ProtectedRoute><AppLayout><WorkerList /></AppLayout></ProtectedRoute>} />
      <Route path="/workers/new" element={<ProtectedRoute><AppLayout><WorkerEnrollment /></AppLayout></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><AppLayout><PaymentList /></AppLayout></ProtectedRoute>} />
      <Route path="/payments/new" element={<ProtectedRoute><AppLayout><PaymentForm /></AppLayout></ProtectedRoute>} />
      <Route path="/funding-requests" element={<ProtectedRoute><AppLayout><FundingRequestList /></AppLayout></ProtectedRoute>} />
      <Route path="/funding-requests/new" element={<ProtectedRoute><AppLayout><FundingRequestForm /></AppLayout></ProtectedRoute>} />
      <Route path="/materials" element={<ProtectedRoute><AppLayout><MaterialRequestList /></AppLayout></ProtectedRoute>} />
      <Route path="/materials/new" element={<ProtectedRoute><AppLayout><MaterialRequestForm /></AppLayout></ProtectedRoute>} />
      <Route path="/logbooks" element={<ProtectedRoute><AppLayout><LogbookList /></AppLayout></ProtectedRoute>} />
      <Route path="/logbooks/new" element={<ProtectedRoute><AppLayout><LogbookForm /></AppLayout></ProtectedRoute>} />
      <Route path="/safety" element={<ProtectedRoute><AppLayout><SafetyReportList /></AppLayout></ProtectedRoute>} />
      <Route path="/safety/new" element={<ProtectedRoute><AppLayout><SafetyReportForm /></AppLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
