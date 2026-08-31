import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ReportIncident from './pages/ReportIncident.jsx';
import TrackReport from './pages/TrackReport.jsx';
import EmergencyHelplines from './pages/EmergencyHelplines.jsx';
import StaffLogin from './pages/StaffLogin.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import NotFound from './pages/NotFound.jsx';
import FieldWorkerDashboard from './pages/dashboards/FieldWorkerDashboard.jsx';
import OperatorDashboard from './pages/dashboards/OperatorDashboard.jsx';
import AdminDashboard from './pages/dashboards/AdminDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<ReportIncident />} />
        <Route path="/track" element={<TrackReport />} />
        <Route path="/track/:referenceCode" element={<TrackReport />} />
        <Route path="/helplines" element={<EmergencyHelplines />} />

        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/unauthorized" element={<Unauthorized />} />
        <Route
          path="/staff/field-worker"
          element={
            <ProtectedRoute allowedRoles={['field_worker']}>
              <FieldWorkerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/operator"
          element={
            <ProtectedRoute allowedRoles={['operator']}>
              <OperatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/staff" element={<Navigate to="/staff/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}