import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  LayoutDashboard,
  Briefcase,
  BookOpen,
  Users,
  Calendar,
  TrendingUp,
} from 'lucide-react';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const statsCards = [
    {
      name: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Jobs',
      value: stats?.totalJobs || 0,
      icon: Briefcase,
      color: 'bg-green-500',
    },
    {
      name: 'Total Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Appointments',
      value: stats?.totalAppointments || 0,
      icon: Calendar,
      color: 'bg-orange-500',
    },
    {
      name: 'Pending Appointments',
      value: stats?.pendingAppointments || 0,
      icon: TrendingUp,
      color: 'bg-red-500',
    },
    {
      name: 'Active Jobs',
      value: stats?.activeJobs || 0,
      icon: LayoutDashboard,
      color: 'bg-teal-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome to the Legal Hub Admin Panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/jobs"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition-colors"
          >
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Manage Jobs</span>
          </a>
          <a
            href="/courses"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Manage Courses</span>
          </a>
          <a
            href="/users"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition-colors"
          >
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Manage Users</span>
          </a>
          <a
            href="/appointments"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">View Appointments</span>
          </a>
        </div>
      </div>
    </div>
  );
}
