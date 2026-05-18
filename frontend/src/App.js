import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login           from './pages/Login';
import EmployeeDash    from './pages/EmployeeDashboard';
import GoalForm        from './pages/GoalForm';
import CheckIn         from './pages/CheckIn';
import ManagerDash     from './pages/ManagerDashboard';
import GoalReview      from './pages/GoalReview';
import AdminDash       from './pages/AdminDashboard';
import Analytics       from './pages/Analytics';
import MLInsights      from './pages/MLInsights';
import AuditLog        from './pages/AuditLog';

function Guard({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role==='employee'?'/employee':user.role==='manager'?'/manager':'/admin'} replace />;
}
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login"                  element={<Login />} />
          <Route path="/"                       element={<Home />} />
          <Route path="/employee"               element={<Guard roles={['employee']}><EmployeeDash /></Guard>} />
          <Route path="/employee/goals"         element={<Guard roles={['employee']}><GoalForm /></Guard>} />
          <Route path="/employee/checkin/:id"   element={<Guard roles={['employee']}><CheckIn /></Guard>} />
          <Route path="/manager"                element={<Guard roles={['manager','admin']}><ManagerDash /></Guard>} />
          <Route path="/manager/review/:id"     element={<Guard roles={['manager','admin']}><GoalReview /></Guard>} />
          <Route path="/admin"                  element={<Guard roles={['admin']}><AdminDash /></Guard>} />
          <Route path="/analytics"              element={<Guard roles={['admin','manager']}><Analytics /></Guard>} />
          <Route path="/ml-insights"            element={<Guard roles={['admin','manager']}><MLInsights /></Guard>} />
          <Route path="/audit"                  element={<Guard roles={['admin']}><AuditLog /></Guard>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
