import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type Appointment } from '@/lib/api';
import {
  Search,
  Calendar as CalendarIcon,
  Clock,
  Mail,
  Phone,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Appointments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => adminApi.getAppointments(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Appointment['status'] }) =>
      adminApi.updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.serviceType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, status: Appointment['status']) => {
    await updateStatusMutation.mutateAsync({ id, status });
  };

  const getStatusBadge = (status: Appointment['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={cn(
          'px-2 py-1 text-xs font-medium rounded-full',
          styles[status]
        )}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading appointments...</div>
      </div>
    );
  }

  const statusCounts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <p className="mt-2 text-sm text-gray-600">
          View and manage consultation appointments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {statusCounts.all}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-yellow-600">Pending</p>
          <p className="mt-2 text-2xl font-bold text-yellow-700">
            {statusCounts.pending}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-blue-600">Confirmed</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {statusCounts.confirmed}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-green-600">Completed</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {statusCounts.completed}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-red-600">Cancelled</p>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {statusCounts.cancelled}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or consultation type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'No appointments found matching your filters.'
              : 'No appointments yet.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.clientName}
                          </h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {appointment.serviceType} - {appointment.serviceTitle || 'Consultation'}
                        </p>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {appointment.clientEmail}
                      </div>
                      {appointment.clientPhone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {appointment.clientPhone}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        {formatDate(appointment.appointmentDate)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {appointment.appointmentTime}
                      </div>
                    </div>

                    {/* Notes */}
                    {appointment.notes && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Notes:</span>{' '}
                          {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex flex-col gap-2">
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusChange(appointment._id, 'confirmed')
                          }
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(appointment._id, 'cancelled')
                          }
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {appointment.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusChange(appointment._id, 'completed')
                          }
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(appointment._id, 'cancelled')
                          }
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
