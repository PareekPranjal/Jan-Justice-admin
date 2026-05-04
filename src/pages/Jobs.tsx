import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  FileText,
  Building2,
  MapPin,
  Clock,
} from 'lucide-react';

const isExpired = (deadline?: string) =>
  deadline ? new Date(deadline) < new Date() : false;

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'active' | 'expired'>('active');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => adminApi.getJobs(),
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      await deleteJobMutation.mutateAsync(id);
    }
  };

  const activeJobs = jobs.filter((j) => !isExpired(j.applicationDeadline));
  const expiredJobs = jobs.filter((j) => isExpired(j.applicationDeadline));

  const displayJobs = (tab === 'active' ? activeJobs : expiredJobs).filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs Management</h1>
          <p className="mt-2 text-sm text-gray-600">Manage job postings and applications</p>
        </div>
        <button
          onClick={() => navigate('/jobs/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Job
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tab === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
            {activeJobs.length}
          </span>
        </button>
        <button
          onClick={() => setTab('expired')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'expired' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          Expired
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tab === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-500'}`}>
            {expiredJobs.length}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs by title, company, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {displayJobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm
              ? 'No jobs found matching your search.'
              : tab === 'expired'
              ? 'No expired jobs.'
              : 'No active jobs. Add your first job!'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayJobs.map((job) => (
              <div key={job._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          {tab === 'expired' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                              Expired {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                            </span>
                          )}
                          {tab === 'active' && job.applicationDeadline && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              Expires {new Date(job.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {job.department && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {job.department}
                            </div>
                          )}
                          {job.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </div>
                          )}
                          {job.jobDescriptionPdf?.url && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              PDF Attached
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {job.tags && job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.tags.map((tag, i) => (
                          <span
                            key={`${tag}-${i}`}
                            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/jobs/${job._id}/edit`)}
                      className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(job._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
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
