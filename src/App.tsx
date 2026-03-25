import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobEditor from './pages/JobEditor';
import Courses from './pages/Courses';
import Users from './pages/Users';
import Appointments from './pages/Appointments';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/new" element={<JobEditor />} />
            <Route path="jobs/:id/edit" element={<JobEditor />} />
            <Route path="courses" element={<Courses />} />
            <Route path="users" element={<Users />} />
            <Route path="appointments" element={<Appointments />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
