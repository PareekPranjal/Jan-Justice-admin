import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../lib/api';
import { ArrowLeft, Save, Trash2, Loader2, Plus, X, Upload, FileText, Tag, CheckCircle } from 'lucide-react';

interface CustomInput {
  label: string;
  value: string;
}

export default function JobEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [postDate, setPostDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [uploadedPdf, setUploadedPdf] = useState<{ url: string; filename: string; size: number; publicId: string; uniqueId: string } | null>(null);
  const [existingPdf, setExistingPdf] = useState<{ url?: string; filename?: string; size?: number; publicId?: string; uniqueId?: string } | null>(null);
  const [applyUrl, setApplyUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [customInputs, setCustomInputs] = useState<CustomInput[]>([]);

  // Load existing job
  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => adminApi.getJob(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (job) {
      setTitle(job.title || '');
      setDescription(job.description || '');
      setDepartment(job.department || '');
      setPostDate(job.postDate ? job.postDate.split('T')[0] : '');
      setExpiryDate(job.applicationDeadline ? job.applicationDeadline.split('T')[0] : '');
      setExistingPdf(job.jobDescriptionPdf || null);
      setApplyUrl(job.applyUrl || '');
      setTags(job.tags || []);
      setCustomInputs(job.customInputs || []);
    }
  }, [job]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Use already-uploaded Cloudinary PDF or existing PDF
      const pdfData = uploadedPdf || (existingPdf?.url ? existingPdf as { url: string; filename?: string; size?: number } : null);

      // Post job as JSON with Cloudinary URL
      const jobData: Record<string, unknown> = {
        title,
        description,
        department,
        isActive: true,
      };
      if (postDate) jobData.postDate = postDate;
      if (expiryDate) jobData.applicationDeadline = expiryDate;
      if (applyUrl.trim()) jobData.applyUrl = applyUrl.trim();
      if (tags.length > 0) jobData.tags = tags;
      if (customInputs.length > 0) jobData.customInputs = customInputs.filter(ci => ci.label.trim());
      if (pdfData) jobData.jobDescriptionPdf = pdfData;

      const fd = new FormData();
      for (const [key, value] of Object.entries(jobData)) {
        fd.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }

      if (isEditing && id) {
        return adminApi.updateJob(id, fd);
      }
      return adminApi.createJob(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate('/jobs');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteJob(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate('/jobs');
    },
  });

  // Auto-resize textarea helper
  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  const descRef = useRef<HTMLTextAreaElement>(null);

  // Resize description on load / data change
  useEffect(() => {
    autoResize(descRef.current);
  }, [description, autoResize]);

  // Custom input handlers
  const addCustomInput = () => {
    setCustomInputs([...customInputs, { label: '', value: '' }]);
  };

  const updateCustomInput = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...customInputs];
    updated[index] = { ...updated[index], [field]: val };
    setCustomInputs(updated);
  };

  const removeCustomInput = (index: number) => {
    setCustomInputs(customInputs.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/jobs')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Job' : 'Create Job'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEditing ? 'Update job posting details' : 'Fill in the details to create a new job posting'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this job?')) {
                  deleteMutation.mutate();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || pdfUploading || !title.trim() || !department.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saveMutation.isPending || pdfUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {pdfUploading ? 'Uploading PDF...' : isEditing ? 'Update Job' : 'Save Job'}
          </button>
        </div>
      </div>

      {saveMutation.isError && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          Error: {(saveMutation.error as Error).message}
        </div>
      )}

      {/* Form */}
      <div className="bg-white border rounded-xl p-6 space-y-5">
        {/* Job Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Name *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="e.g. Senior Legal Advisor"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            ref={descRef}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              autoResize(e.target);
            }}
            rows={3}
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none overflow-hidden"
            placeholder="Brief job description..."
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="e.g. Legal, Engineering, HR"
          />
        </div>

        {/* Dates Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Post Date</label>
            <input
              type="date"
              value={postDate}
              onChange={(e) => setPostDate(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Apply URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apply URL</label>
          <input
            type="url"
            value={applyUrl}
            onChange={(e) => setApplyUrl(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="https://example.com/apply or original job post link"
          />
          <p className="text-xs text-gray-400 mt-1">Users will be redirected here when they click "Apply Now"</p>
        </div>

        {/* PDF Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PDF Attachment</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={async (e) => {
              const file = e.target.files?.[0] || null;
              setPdfFile(file);
              setUploadedPdf(null);
              if (file) {
                setPdfUploading(true);
                try {
                  const result = await adminApi.uploadPdf(file, title.trim() || undefined);
                  setUploadedPdf(result);
                } catch {
                  setPdfFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  alert('PDF upload failed. Please try again.');
                } finally {
                  setPdfUploading(false);
                }
              }
            }}
            className="hidden"
          />

          {pdfFile ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
              {uploadedPdf ? (
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              ) : pdfUploading ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
              ) : (
                <FileText className="h-5 w-5 text-red-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                <p className="text-xs text-gray-500">
                  {uploadedPdf
                    ? <span>Uploaded · <span className="font-mono font-semibold text-green-600">{uploadedPdf.uniqueId}</span></span>
                    : pdfUploading ? 'Uploading to Cloudinary...'
                    : `${(pdfFile.size / 1024).toFixed(1)} KB · Will upload on save`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPdfFile(null);
                  setUploadedPdf(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ) : existingPdf?.url ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
              <FileText className="h-5 w-5 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{existingPdf.filename || 'Uploaded PDF'}</p>
                <p className="text-xs text-gray-500">
                  {existingPdf.size ? `${(existingPdf.size / 1024).toFixed(1)} KB` : ''}
                  {existingPdf.uniqueId && <span> · <span className="font-mono font-semibold text-green-600">{existingPdf.uniqueId}</span></span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-primary font-medium hover:underline"
              >
                Replace
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex flex-col items-center gap-2"
            >
              <Upload className="h-6 w-6" />
              <span>Click to upload PDF</span>
              <span className="text-xs text-gray-400">Max 10MB</span>
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Tags / Badges</h3>
        </div>

        {/* Quick-add preset tags */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {['Full-time', 'Part-time', 'Contract', 'Internship', 'On-site', 'Remote', 'Hybrid', 'Urgent', 'Walk-in'].map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={tags.includes(preset)}
                onClick={() => setTags([...tags, preset])}
                className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="Custom tag..."
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!tagInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Tags appear as badges on the job card. Press Enter or click Add.
        </p>
      </div>

      {/* Custom Inputs */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Additional Information</h3>
          <button
            type="button"
            onClick={addCustomInput}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add New Input
          </button>
        </div>

        {customInputs.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No additional fields. Click "Add New Input" to add custom information.
          </p>
        )}

        <div className="space-y-3">
          {customInputs.map((input, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={input.label}
                  onChange={(e) => updateCustomInput(index, 'label', e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Field name"
                />
                <textarea
                  value={input.value}
                  onChange={(e) => {
                    updateCustomInput(index, 'value', e.target.value);
                    autoResize(e.target);
                  }}
                  ref={(el) => { if (el) autoResize(el); }}
                  rows={1}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none overflow-hidden"
                  placeholder="Value"
                />
              </div>
              <button
                type="button"
                onClick={() => removeCustomInput(index)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
