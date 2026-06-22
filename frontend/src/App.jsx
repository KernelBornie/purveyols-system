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

            {/* Procurement / Material Requisition */}
            <Route path="/procurement" element={<ProcurementList />} />
            <Route path="/procurement/new" element={<ProcurementForm />} />
            <Route path="/procurement/:id" element={<ProcurementForm />} />
            <Route path="/procurement/:id/edit" element={<ProcurementForm />} />

            {/* Funding Requests */}
            <Route path="/funding" element={<FundingRequestList />} />
            <Route path="/funding/new" element={<FundingRequestForm />} />
            <Route path="/funding/:id" element={<FundingRequestForm />} />
            <Route path="/funding/:id/edit" element={<FundingRequestForm />} />

            {/* Payments - redirect */}
            <Route path="/payments/:id" element={<Navigate to="/dashboard" replace />} />

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
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
