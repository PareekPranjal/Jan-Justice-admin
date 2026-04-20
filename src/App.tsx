import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobEditor from './pages/JobEditor';
import Courses from './pages/Courses';
import Users from './pages/Users';
import Appointments from './pages/Appointments';
import ConsultancySettings from './pages/ConsultancySettings';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});


function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={user ? <AdminLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/new" element={<JobEditor />} />
        <Route path="jobs/:id/edit" element={<JobEditor />} />
        <Route path="courses" element={<Courses />} />
        <Route path="users" element={<Users />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="consultancy-settings" element={<ConsultancySettings />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
