import { Routes, Route, Navigate } from 'react-router-dom';
import './components/modals/Modal.css';
import './App.css';
import GlobalClickBurst from './components/GlobalClickBurst';

import { RoleProvider } from './context/RoleContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './components/AppLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AnalystDashboard from './pages/AnalystDashboard';
import ViewerDashboard from './pages/ViewerDashboard';
import TicketDetail from './pages/TicketDetail';

export default function App() {
  const isLandingPage = window.location.pathname === '/';

  return (
    <RoleProvider>
      {!isLandingPage && <GlobalClickBurst />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tickets/:id"
          element={
            <ProtectedRoute role="Admin">
              <AppLayout><TicketDetail /></AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analyst"
          element={
            <ProtectedRoute role="Analyst">
              <AnalystDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyst/tickets/:id"
          element={
            <ProtectedRoute role="Analyst">
              <AppLayout><TicketDetail /></AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/viewer"
          element={
            <ProtectedRoute role="Viewer">
              <ViewerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/viewer/tickets/:id"
          element={
            <ProtectedRoute role="Viewer">
              <AppLayout><TicketDetail /></AppLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RoleProvider>
  );
}