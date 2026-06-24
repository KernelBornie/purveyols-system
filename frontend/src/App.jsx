import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DeliveryNoteList from './pages/delivery/DeliveryNoteList';
import DeliveryNote from './pages/delivery/DeliveryNote';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import WorkerList from './pages/workers/WorkerList';
import WorkerForm from './pages/workers/WorkerForm';
import ProjectList from './pages/projects/ProjectList';
import ProjectForm from './pages/projects/ProjectForm';
import ProcurementList from './pages/procurement/ProcurementList';
import ProcurementForm from './pages/procurement/ProcurementForm';
import FundingRequestList from './pages/funding/FundingRequestList';
import FundingRequestForm from './pages/funding/FundingRequestForm';
import SubcontractList from './pages/subcontracts/SubcontractList';
import SubcontractForm from './pages/subcontracts/SubcontractForm';
import BOQList from './pages/boq/BOQList';
import BOQForm from './pages/boq/BOQForm';
import Messages from './pages/Messages';
import ForgotPassword from './pages/ForgotPassword';
import AdvertisedProjects from './pages/advertised/AdvertisedProjects';
import BiddedProjects from './pages/advertised/BiddedProjects';
import SitePlanList from './pages/site-plans/SitePlanList';
import SitePlanForm from './pages/site-plans/SitePlanForm';
import DrawingList from './pages/drawings/DrawingList';
import DrawingForm from './pages/drawings/DrawingForm';
import SurveyList from './pages/surveys/SurveyList';
import SurveyForm from './pages/surveys/SurveyForm';
import ProjectPlanning from './pages/projects/ProjectPlanning';
// ─── FIX: Correct import path for Notifications ──────────────────
import Notifications from './pages/notifications/Notifications';
import SparePartList from './pages/spare-parts/SparePartList';
import SparePartForm from './pages/spare-parts/SparePartForm';
import SafetyReportList from './pages/safety/SafetyReportList';
import SafetyReportForm from './pages/safety/SafetyReportForm';
import PaymentNotifications from './pages/PaymentNotifications';
import PaymentDetails from './pages/PaymentDetails';
import PaymentList from './pages/payments/PaymentList';

const AuthRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading) navigate(user ? '/dashboard' : '/login', { replace: true });
  }, [user, loading, navigate]);
  return <div>Loading...</div>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<AuthRedirect />} />
          <Route path="/change-password" element={<Navigate to="/profile" />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<Navigate to="/messages" replace />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Workers */}
            <Route path="/workers" element={<WorkerList />} />
            <Route path="/workers/new" element={<WorkerForm />} />
            <Route path="/workers/:id" element={<WorkerForm />} />
            <Route path="/workers/:id/edit" element={<WorkerForm />} />

            {/* Projects */}
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/new" element={<ProjectForm />} />
            <Route path="/projects/:id" element={<ProjectForm />} />
            <Route path="/projects/:id/edit" element={<ProjectForm />} />
            <Route path="/projects/:projectId/planning" element={<ProjectPlanning />} />

            {/* Procurement */}
            <Route path="/procurement" element={<ProcurementList />} />
            <Route path="/procurement/new" element={<ProcurementForm />} />
            <Route path="/procurement/:id" element={<ProcurementForm />} />
            <Route path="/procurement/:id/edit" element={<ProcurementForm />} />

            {/* Funding Requests */}
            <Route path="/funding" element={<FundingRequestList />} />
            <Route path="/funding/new" element={<FundingRequestForm />} />
            <Route path="/funding/:id" element={<FundingRequestForm />} />
            <Route path="/funding/:id/edit" element={<FundingRequestForm />} />

            {/* ─── Payments ────────────────────────────────────────────── */}
            <Route path="/payments" element={<PaymentList />} />
            <Route path="/payments/:id" element={<PaymentDetails />} />

            {/* Subcontracts */}
            <Route path="/subcontracts" element={<SubcontractList />} />
            <Route path="/subcontracts/new" element={<SubcontractForm />} />
            <Route path="/subcontracts/:id" element={<SubcontractForm />} />
            <Route path="/subcontracts/:id/edit" element={<SubcontractForm />} />

            {/* BOQ */}
            <Route path="/boq" element={<BOQList />} />
            <Route path="/boq/new" element={<BOQForm />} />
            <Route path="/boq/:id" element={<BOQForm />} />
            <Route path="/boq/:id/edit" element={<BOQForm />} />

            {/* Advertised Projects */}
            <Route path="/advertised-projects" element={<AdvertisedProjects />} />
            <Route path="/advertised-projects/bidded" element={<BiddedProjects />} />

            {/* Delivery Notes */}
            <Route path="/delivery" element={<DeliveryNoteList />} />
            <Route path="/delivery/new" element={<DeliveryNote />} />
            <Route path="/delivery/:id" element={<DeliveryNote />} />
            <Route path="/delivery/:id/edit" element={<DeliveryNote />} />

            {/* Site Plans */}
            <Route path="/site-plans" element={<SitePlanList />} />
            <Route path="/site-plans/new" element={<SitePlanForm />} />
            <Route path="/site-plans/:id" element={<SitePlanForm />} />
            <Route path="/site-plans/:id/edit" element={<SitePlanForm />} />

            {/* Drawings */}
            <Route path="/drawings" element={<DrawingList />} />
            <Route path="/drawings/new" element={<DrawingForm />} />
            <Route path="/drawings/:id" element={<DrawingForm />} />
            <Route path="/drawings/:id/edit" element={<DrawingForm />} />

            {/* Surveys */}
            <Route path="/surveys" element={<SurveyList />} />
            <Route path="/surveys/new" element={<SurveyForm />} />
            <Route path="/surveys/:id" element={<SurveyForm />} />
            <Route path="/surveys/:id/edit" element={<SurveyForm />} />

            {/* Spare Parts */}
            <Route path="/spare-parts" element={<SparePartList />} />
            <Route path="/spare-parts/new" element={<SparePartForm />} />
            <Route path="/spare-parts/:id" element={<SparePartForm />} />
            <Route path="/spare-parts/:id/edit" element={<SparePartForm />} />

            {/* Safety Reports */}
            <Route path="/safety-reports" element={<SafetyReportList />} />
            <Route path="/safety-reports/new" element={<SafetyReportForm />} />
            <Route path="/safety-reports/:id" element={<SafetyReportForm />} />
            <Route path="/safety-reports/:id/edit" element={<SafetyReportForm />} />

            {/* Payment Notifications */}
            <Route path="/payment-notifications" element={<PaymentNotifications />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;