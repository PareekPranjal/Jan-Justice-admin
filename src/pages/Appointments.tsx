import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type Appointment } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Calendar as CalendarIcon,
  Clock,
  Mail,
  Phone,
  CreditCard,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    border: 'border-l-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800',
    tab: 'border-yellow-400 text-yellow-700 bg-yellow-50',
    count: 'text-yellow-700',
  },
  confirmed: {
    label: 'Confirmed',
    border: 'border-l-blue-400',
    badge: 'bg-blue-100 text-blue-800',
    tab: 'border-blue-400 text-blue-700 bg-blue-50',
    count: 'text-blue-700',
  },
  completed: {
    label: 'Completed',
    border: 'border-l-green-400',
    badge: 'bg-green-100 text-green-800',
    tab: 'border-green-400 text-green-700 bg-green-50',
    count: 'text-green-700',
  },
  cancelled: {
    label: 'Cancelled',
    border: 'border-l-red-400',
    badge: 'bg-red-100 text-red-800',
    tab: 'border-red-400 text-red-700 bg-red-50',
    count: 'text-red-700',
  },
} as const;

const ACTION_HISTORY_STYLES: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  rescheduled: 'bg-purple-100 text-purple-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

const NEXT_STATUSES: Record<Appointment['status'], Appointment['status'][]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function AppointmentCard({
  appointment,
  isPending,
  onStatusChange,
}: {
  appointment: Appointment;
  isPending: boolean;
  onStatusChange: (id: string, status: Appointment['status']) => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const config = STATUS_CONFIG[appointment.status];
  const nextStatuses = NEXT_STATUSES[appointment.status];

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 border-l-4 shadow-sm overflow-hidden',
        config.border
      )}
    >
      {/* Card Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: name + service */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {appointment.clientName}
                </h3>
                <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', config.badge)}>
                  {config.label}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-gray-500 capitalize">
                {appointment.serviceType} · {appointment.serviceTitle || 'Consultation'}
                {appointment.servicePrice ? ` · ₹${appointment.servicePrice.toLocaleString('en-IN')}` : ''}
              </p>
            </div>
          </div>

          {/* Right: date + time */}
          <div className="flex-shrink-0 text-right">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 justify-end">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              {formatDate(appointment.appointmentDate)}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 justify-end mt-0.5">
              <Clock className="h-4 w-4 text-gray-400" />
              {appointment.appointmentTime}
            </div>
          </div>
        </div>

        {/* Contact row */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            {appointment.clientEmail}
          </div>
          {appointment.clientPhone && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              {appointment.clientPhone}
            </div>
          )}
        </div>

        {/* UTR */}
        {appointment.transactionId && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
            <CreditCard className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <span className="text-xs text-green-600">UTR / Txn ID:</span>
            <span className="font-mono text-xs font-semibold text-green-800">
              {appointment.transactionId}
            </span>
          </div>
        )}

        {/* Notes */}
        {appointment.notes && (
          <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-600">
              <span className="font-medium text-gray-700">Note:</span> {appointment.notes}
            </p>
          </div>
        )}

        {/* Action History toggle */}
        {appointment.actionHistory && appointment.actionHistory.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {historyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {appointment.actionHistory.length} action{appointment.actionHistory.length !== 1 ? 's' : ''} logged
            </button>
            {historyOpen && (
              <div className="mt-2 space-y-1.5 pl-1 border-l-2 border-gray-100 ml-1">
                {appointment.actionHistory.map((entry, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded font-medium capitalize',
                        ACTION_HISTORY_STYLES[entry.action] || 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {entry.action}
                    </span>
                    <span>
                      by <strong>{entry.adminName}</strong>
                    </span>
                    <span className="text-gray-400">
                      · {new Date(entry.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    {entry.note && <span className="text-gray-400 italic">({entry.note})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer — action bar */}
      {nextStatuses.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Move to:</span>
          <div className="flex items-center gap-2">
            {nextStatuses.map((next) => {
              const nextConfig = STATUS_CONFIG[next];
              const isConfirm = next === 'confirmed' || next === 'completed';
              return (
                <button
                  key={next}
                  onClick={() => onStatusChange(appointment._id, next)}
                  disabled={isPending}
                  className={cn(
                    'px-4 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                    isConfirm
                      ? cn(nextConfig.tab, 'border hover:opacity-90')
                      : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                  )}
                >
                  {isPending ? '...' : nextConfig.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Terminal state footer */}
      {nextStatuses.length === 0 && (
        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100">
          <span className="text-xs text-gray-400 italic">
            {appointment.status === 'completed' ? 'This appointment has been completed.' : 'This appointment was cancelled.'}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Appointments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => adminApi.getAppointments(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Appointment['status'] }) => {
      const actionBy = user
        ? { adminId: user._id, adminName: `${user.firstName} ${user.lastName}` }
        : undefined;
      return adminApi.updateAppointmentStatus(id, status, actionBy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const statusCounts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading appointments...</div>
      </div>
    );
  }

  const tabs = [
    { key: 'all', label: 'All', count: statusCounts.all, activeClass: 'border-gray-700 text-gray-900 bg-gray-100' },
    { key: 'pending', label: 'Pending', count: statusCounts.pending, activeClass: STATUS_CONFIG.pending.tab },
    { key: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed, activeClass: STATUS_CONFIG.confirmed.tab },
    { key: 'completed', label: 'Completed', count: statusCounts.completed, activeClass: STATUS_CONFIG.completed.tab },
    { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled, activeClass: STATUS_CONFIG.cancelled.tab },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and track consultation bookings</p>
        </div>
        <span className="text-sm text-gray-400">{filteredAppointments.length} showing</span>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all',
              statusFilter === tab.key
                ? cn(tab.activeClass, 'border-current shadow-sm')
                : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-xs font-semibold',
                statusFilter === tab.key ? 'bg-white bg-opacity-60' : 'bg-gray-100 text-gray-600'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or service type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Cards Grid */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarIcon className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">
            {searchTerm || statusFilter !== 'all'
              ? 'No appointments match your filters.'
              : 'No appointments yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id}
              appointment={appointment}
              isPending={updateStatusMutation.isPending}
              onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
