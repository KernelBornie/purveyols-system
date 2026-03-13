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
          <ProtectedRoute roles={["director", "engineer", "foreman"]}>
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
          <ProtectedRoute roles={["director", "engineer", "foreman", "driver"]}>
            <Layout>
              <LogbookList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/logbooks/new"
        element={
          <ProtectedRoute roles={["director", "engineer", "foreman", "driver"]}>
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
          <ProtectedRoute roles={["director", "engineer", "accountant"]}>
            <Layout>
              <FundingRequestList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/funding-requests/new"
        element={
          <ProtectedRoute roles={["director", "engineer", "accountant"]}>
            <Layout>
              <FundingRequestForm />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* PROCUREMENT */}

      <Route
        path="/procurement"
        element={
          <ProtectedRoute roles={["director", "procurement", "engineer"]}>
            <Layout>
              <ProcurementList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/procurement/new"
        element={
          <ProtectedRoute roles={["director", "procurement", "engineer"]}>
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