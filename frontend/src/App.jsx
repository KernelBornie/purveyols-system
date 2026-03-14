import { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, AuthContext } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import WorkerList from "./pages/workers/WorkerList";
import WorkerForm from "./pages/workers/WorkerForm";

import ProjectList from "./pages/projects/ProjectList";
import ProjectForm from "./pages/projects/ProjectForm";

import FundingRequestList from "./pages/funding/FundingRequestList";
import FundingRequestForm from "./pages/funding/FundingRequestForm";

import LogbookList from "./pages/logbooks/LogbookList";
import LogbookForm from "./pages/logbooks/LogbookForm";

import ProcurementList from "./pages/procurement/ProcurementList";
import ProcurementForm from "./pages/procurement/ProcurementForm";

import PaymentList from "./pages/payments/PaymentList";
import PaymentForm from "./pages/payments/PaymentForm";

import BOQList from "./pages/boq/BOQList";
import BOQForm from "./pages/boq/BOQForm";

import SubcontractList from "./pages/subcontracts/SubcontractList";
import SubcontractForm from "./pages/subcontracts/SubcontractForm";

import SafetyReportList from "./pages/safety/SafetyReportList";
import Reports from "./pages/reports/Reports";

const ALL_ROLES = ["director", "accountant", "engineer", "foreman", "driver", "procurement", "safety", "admin"];

const Layout = ({ children }) => (
  <div className="layout">

    <Sidebar />

    <div className="main-content">

      <Navbar />

      <div className="page-content">
        {children}
      </div>

    </div>

  </div>
);


const AppRoutes = () => {

  const { user } = useContext(AuthContext);

  if (user === undefined) return null;

  return (

    <Routes>

      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />



      {/* DASHBOARD */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* PROJECTS */}

      <Route
        path="/projects"
        element={
          <ProtectedRoute roles={["director", "engineer", "foreman"]}>
            <Layout>
              <ProjectList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects/new"
        element={
          <ProtectedRoute roles={["director", "engineer"]}>
            <Layout>
              <ProjectForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects/:id/edit"
        element={
          <ProtectedRoute roles={["director", "engineer", "foreman"]}>
            <Layout>
              <ProjectForm />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* WORKERS */}

      <Route
        path="/workers"
        element={
          <ProtectedRoute roles={["director", "engineer", "foreman", "accountant"]}>
            <Layout>
              <WorkerList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/workers/new"
        element={
          <ProtectedRoute roles={["director", "engineer", "foreman"]}>
            <Layout>
              <WorkerForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/workers/:id/edit"
        element={
          <ProtectedRoute roles={["director", "engineer", "foreman"]}>
            <Layout>
              <WorkerForm />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* LOGBOOK */}

      <Route
        path="/logbooks"
        element={
          <ProtectedRoute roles={["director", "accountant", "driver"]}>
            <Layout>
              <LogbookList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/logbooks/new"
        element={
          <ProtectedRoute roles={["driver"]}>
            <Layout>
              <LogbookForm />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* FUNDING */}

      <Route
        path="/funding-requests"
        element={
          <ProtectedRoute roles={["director", "engineer", "accountant", "foreman", "driver", "procurement"]}>
            <Layout>
              <FundingRequestList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/funding-requests/new"
        element={
          <ProtectedRoute roles={["director", "engineer", "accountant", "foreman", "driver", "procurement"]}>
            <Layout>
              <FundingRequestForm />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* PROCUREMENT / MATERIAL REQUESTS */}

      <Route
        path="/procurement"
        element={
          <ProtectedRoute roles={["director", "procurement", "engineer", "foreman", "driver", "safety"]}>
            <Layout>
              <ProcurementList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/procurement/new"
        element={
          <ProtectedRoute roles={["director", "procurement", "engineer", "foreman", "driver", "safety"]}>
            <Layout>
              <ProcurementForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/procurement/:id/edit"
        element={
          <ProtectedRoute roles={["director", "procurement"]}>
            <Layout>
              <ProcurementForm />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* PAYMENTS */}

      <Route
        path="/payments"
        element={
          <ProtectedRoute roles={["director", "accountant"]}>
            <Layout>
              <PaymentList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments/new"
        element={
          <ProtectedRoute roles={["accountant"]}>
            <Layout>
              <PaymentForm />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* BOQ */}

      <Route
        path="/boq"
        element={
          <ProtectedRoute roles={["director", "engineer", "admin"]}>
            <Layout>
              <BOQList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/boq/new"
        element={
          <ProtectedRoute roles={["director", "engineer", "admin"]}>
            <Layout>
              <BOQForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/boq/:id/edit"
        element={
          <ProtectedRoute roles={["director", "engineer", "admin"]}>
            <Layout>
              <BOQForm />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* SUBCONTRACTS */}

      <Route
        path="/subcontracts"
        element={
          <ProtectedRoute roles={["director", "engineer", "admin"]}>
            <Layout>
              <SubcontractList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/subcontracts/new"
        element={
          <ProtectedRoute roles={["director", "engineer", "admin"]}>
            <Layout>
              <SubcontractForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/subcontracts/:id/edit"
        element={
          <ProtectedRoute roles={["director", "engineer", "admin"]}>
            <Layout>
              <SubcontractForm />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* SAFETY REPORTS */}

      <Route
        path="/safety"
        element={
          <ProtectedRoute roles={["director", "safety", "engineer"]}>
            <Layout>
              <SafetyReportList />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* REPORTS */}

      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={["director", "accountant", "engineer"]}>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />


      <Route path="*" element={<Navigate to="/dashboard" replace />} />

    </Routes>

  );

};


const App = () => (

  <BrowserRouter>

    <AuthProvider>

      <AppRoutes />

    </AuthProvider>

  </BrowserRouter>

);

export default App;