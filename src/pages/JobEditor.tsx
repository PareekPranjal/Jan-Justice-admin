import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../lib/api';
import { ArrowLeft, Save, Trash2, Loader2, Plus, X, Upload, FileText, Tag, CheckCircle, GripVertical, Copy, Users } from 'lucide-react';

interface CustomInput {
  label: string;
  value: string;
  isPreset?: boolean;
}

interface ExtraRole {
  id: string;
  customInputs: CustomInput[];
}

const DEFAULT_PRESET_FIELDS = ['Post Name', 'Age', 'Qualification', 'Experience', 'Salary'];

const makeRoleId = () => `role-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
  const [isPdfDragging, setIsPdfDragging] = useState(false);
  const [uploadedPdf, setUploadedPdf] = useState<{ url: string; filename: string; size: number; publicId: string; uniqueId: string } | null>(null);
  const [existingPdf, setExistingPdf] = useState<{ url?: string; filename?: string; size?: number; publicId?: string; uniqueId?: string } | null>(null);
  const [applyUrl, setApplyUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [customInputs, setCustomInputs] = useState<CustomInput[]>([]);
  const [extraRoles, setExtraRoles] = useState<ExtraRole[]>([]);
  const [presetFields, setPresetFields] = useState<string[]>(DEFAULT_PRESET_FIELDS);
  const [newPresetInput, setNewPresetInput] = useState('');

  // Drag-and-drop state for reordering Added Fields
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggableIndex, setDraggableIndex] = useState<number | null>(null);

  // Load settings (preset fields)
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => adminApi.getSettings(),
  });

  useEffect(() => {
    if (settings?.presetFields?.length) {
      setPresetFields(settings.presetFields);
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: (fields: string[]) => adminApi.updateSettings({ presetFields: fields }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

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

      // Multi-role aware loading: if job.roles has 2+, role[0] -> customInputs (Role 1), rest -> extraRoles.
      // Otherwise fall back to legacy single-role customInputs.
      if (job.roles && job.roles.length >= 2) {
        const role1 = job.roles[0];
        setCustomInputs((role1?.customInputs || []) as CustomInput[]);
        setExtraRoles(
          job.roles.slice(1).map(r => ({
            id: r.id || makeRoleId(),
            customInputs: (r.customInputs || []) as CustomInput[],
          }))
        );
      } else {
        setCustomInputs(job.customInputs || []);
        setExtraRoles([]);
      }
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
      // Always send these so clearing them on edit actually persists
      jobData.applyUrl = applyUrl.trim();
      jobData.tags = tags;
      const role1Inputs = customInputs.filter(ci => ci.label.trim());
      // Always populate customInputs (mirror Role 1) so old display & old code paths keep working.
      jobData.customInputs = role1Inputs;
      // Only persist `roles` array when admin has actually added a 2nd+ role.
      // Otherwise send empty array to clear any previously saved roles.
      if (extraRoles.length >= 1) {
        jobData.roles = [
          { id: 'role-1', customInputs: role1Inputs },
          ...extraRoles.map(r => ({
            id: r.id,
            customInputs: r.customInputs.filter(ci => ci.label.trim()),
          })),
        ];
      } else {
        jobData.roles = [];
      }
      if (pdfData) jobData.jobDescriptionPdf = pdfData;

      if (isEditing && id) {
        return adminApi.updateJob(id, jobData);
      }
      return adminApi.createJob(jobData);
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
    setCustomInputs([...customInputs, { label: '', value: '', isPreset: false }]);
  };

  const togglePreset = (label: string) => {
    const existingIndex = customInputs.findIndex(ci => ci.label === label);
    if (existingIndex >= 0) {
      setCustomInputs(customInputs.filter((_, i) => i !== existingIndex));
    } else {
      setCustomInputs([...customInputs, { label, value: '', isPreset: true }]);
    }
  };

  const addPostSet = () => {
    const toAdd = presetFields
      .filter(label => !customInputs.some(ci => ci.label === label))
      .map(label => ({ label, value: '', isPreset: true }));
    setCustomInputs([...customInputs, ...toAdd]);
  };

  const addPresetField = () => {
    const trimmed = newPresetInput.trim();
    if (trimmed && !presetFields.includes(trimmed)) {
      const updated = [...presetFields, trimmed];
      setPresetFields(updated);
      setNewPresetInput('');
      saveSettingsMutation.mutate(updated);
    }
  };

  const removePresetField = (label: string) => {
    const updated = presetFields.filter(f => f !== label);
    setPresetFields(updated);
    saveSettingsMutation.mutate(updated);
  };

  const updateCustomInput = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...customInputs];
    updated[index] = { ...updated[index], [field]: val };
    setCustomInputs(updated);
  };

  const removeCustomInput = (index: number) => {
    setCustomInputs(customInputs.filter((_, i) => i !== index));
  };

  // ---- Extra roles (Role 2, 3, …) ----
  const addExtraRole = () => {
    // Seed new role with the same labels as Role 1 (empty values) so user starts with the same structure.
    const seedInputs: CustomInput[] = customInputs.map(ci => ({ label: ci.label, value: '', isPreset: ci.isPreset }));
    setExtraRoles([...extraRoles, { id: makeRoleId(), customInputs: seedInputs }]);
  };

  const removeExtraRole = (roleIndex: number) => {
    setExtraRoles(extraRoles.filter((_, i) => i !== roleIndex));
  };

  const updateExtraRoleInput = (roleIndex: number, fieldIndex: number, key: 'label' | 'value', val: string) => {
    setExtraRoles(prev => prev.map((r, i) => {
      if (i !== roleIndex) return r;
      const updated = [...r.customInputs];
      updated[fieldIndex] = { ...updated[fieldIndex], [key]: val };
      return { ...r, customInputs: updated };
    }));
  };

  const removeExtraRoleInput = (roleIndex: number, fieldIndex: number) => {
    setExtraRoles(prev => prev.map((r, i) => i === roleIndex
      ? { ...r, customInputs: r.customInputs.filter((_, j) => j !== fieldIndex) }
      : r
    ));
  };

  const addExtraRoleInput = (roleIndex: number) => {
    setExtraRoles(prev => prev.map((r, i) => i === roleIndex
      ? { ...r, customInputs: [...r.customInputs, { label: '', value: '', isPreset: false }] }
      : r
    ));
  };

  // Copy ONE field from Role 1 into the same-labelled field of the extra role.
  // If extra role doesn't have that label yet, append it.
  const copyFieldFromRole1 = (roleIndex: number, fieldIndex: number) => {
    const target = extraRoles[roleIndex]?.customInputs[fieldIndex];
    if (!target) return;
    const source = customInputs.find(ci => ci.label === target.label);
    if (!source) return;
    updateExtraRoleInput(roleIndex, fieldIndex, 'value', source.value);
  };

  // Copy ALL fields from Role 1 into this extra role (replaces existing values, keeps labels).
  const copyAllFromRole1 = (roleIndex: number) => {
    const cloned: CustomInput[] = customInputs.map(ci => ({ label: ci.label, value: ci.value, isPreset: ci.isPreset }));
    setExtraRoles(prev => prev.map((r, i) => i === roleIndex ? { ...r, customInputs: cloned } : r));
  };

  // Toggle a single preset field in/out of the given extra role
  const togglePresetForExtraRole = (roleIndex: number, label: string) => {
    setExtraRoles(prev => prev.map((r, i) => {
      if (i !== roleIndex) return r;
      const exists = r.customInputs.findIndex(ci => ci.label === label);
      if (exists >= 0) {
        return { ...r, customInputs: r.customInputs.filter((_, j) => j !== exists) };
      }
      return { ...r, customInputs: [...r.customInputs, { label, value: '', isPreset: true }] };
    }));
  };

  // Add all missing preset fields (empty values) to the given extra role
  const addPostSetForExtraRole = (roleIndex: number) => {
    setExtraRoles(prev => prev.map((r, i) => {
      if (i !== roleIndex) return r;
      const toAdd = presetFields
        .filter(label => !r.customInputs.some(ci => ci.label === label))
        .map(label => ({ label, value: '', isPreset: true } as CustomInput));
      return { ...r, customInputs: [...r.customInputs, ...toAdd] };
    }));
  };

  const reorderCustomInputs = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const updated = [...customInputs];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setCustomInputs(updated);
  };

  const handleFieldDragStart = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox needs data set to start a drag
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleFieldDragOver = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    if (draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== index) setDragOverIndex(index);
  };

  const handleFieldDrop = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedIndex !== null) reorderCustomInputs(draggedIndex, index);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggableIndex(null);
  };

  const handleFieldDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggableIndex(null);
  };

  // Shared PDF upload handler — used by both file input and drag-and-drop
  const handlePdfFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('PDF must be 10MB or smaller.');
      return;
    }
    setPdfFile(file);
    setUploadedPdf(null);
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
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePdfFile(file);
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
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsPdfDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
                if (!isPdfDragging) setIsPdfDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Only clear if leaving the dropzone itself, not a child
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setIsPdfDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsPdfDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handlePdfFile(file);
              }}
              className={`w-full py-8 border-2 border-dashed rounded-lg text-sm transition-colors flex flex-col items-center gap-2 cursor-pointer ${
                isPdfDragging
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-300 text-gray-500 hover:border-primary hover:text-primary'
              }`}
            >
              <Upload className="h-6 w-6" />
              <span>{isPdfDragging ? 'Drop PDF here' : 'Click or drag PDF to upload'}</span>
              <span className="text-xs text-gray-400">Max 10MB</span>
            </div>
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
            {['Full-time', 'Part-time', 'Contract', 'Internship', 'On-site', 'Remote', 'Hybrid', 'Urgent', 'Walk-in'].map((preset) => {
              const isAdded = tags.includes(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    if (isAdded) {
                      setTags(tags.filter(t => t !== preset));
                    } else {
                      setTags([...tags, preset]);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-normal border transition-colors ${
                    isAdded
                      ? 'bg-primary/10 text-primary border-primary/40'
                      : 'bg-gray-100 text-gray-800 border-gray-300 hover:border-primary hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {isAdded ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-800 border border-gray-300 rounded-md text-sm font-normal"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
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

      {/* Custom Inputs (Role 1 when multi-role mode is active) */}
      <div className={`bg-white border rounded-xl p-6 space-y-5 ${extraRoles.length >= 1 ? 'border-blue-300 ring-1 ring-blue-100' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              {extraRoles.length >= 1 && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">
                  <Users className="h-3 w-3" /> Role 1
                </span>
              )}
              Additional Information
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {extraRoles.length >= 1
                ? 'Master role — fields here can be copied into other roles using the 📋 button.'
                : 'Add preset or custom fields to display on the job listing'}
            </p>
          </div>
        </div>

        {/* Preset quick-add */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Add Preset Fields</p>

          {/* Preset badges */}
          <div className="flex flex-wrap gap-2">
            {presetFields.map((label) => {
              const isAdded = customInputs.some(ci => ci.label === label);
              return (
                <div
                  key={label}
                  className={`inline-flex items-center rounded-md border overflow-hidden transition-colors ${
                    isAdded ? 'border-primary/40' : 'border-gray-300'
                  }`}
                >
                  {/* Toggle button */}
                  <button
                    type="button"
                    onClick={() => togglePreset(label)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-normal transition-colors ${
                      isAdded
                        ? 'bg-primary/10 text-primary hover:bg-primary/15'
                        : 'bg-gray-100 text-gray-800 hover:bg-primary/5 hover:text-primary'
                    }`}
                  >
                    {isAdded ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {label}
                  </button>
                  {/* Delete from palette */}
                  <button
                    type="button"
                    onClick={() => removePresetField(label)}
                    className={`px-1.5 py-1.5 border-l transition-colors ${
                      isAdded
                        ? 'border-primary/20 text-primary/50 hover:bg-red-50 hover:text-red-500'
                        : 'border-gray-300 text-gray-400 hover:bg-red-50 hover:text-red-500'
                    }`}
                    title="Remove from preset list"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add new preset */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newPresetInput}
              onChange={(e) => setNewPresetInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPresetField(); } }}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="New preset label..."
            />
            <button
              type="button"
              onClick={addPresetField}
              disabled={!newPresetInput.trim() || presetFields.includes(newPresetInput.trim())}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <button
              type="button"
              onClick={addPostSet}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/15 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add All Preset Fields
            </button>
          </div>
        </div>

        {/* Fields list */}
        {customInputs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Added Fields</p>
            <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2 scroll-smooth">
              {customInputs.map((input, index) => {
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index && draggedIndex !== index;
                return (
                  <div
                    key={index}
                    draggable={draggableIndex === index}
                    onDragStart={handleFieldDragStart(index)}
                    onDragOver={handleFieldDragOver(index)}
                    onDrop={handleFieldDrop(index)}
                    onDragEnd={handleFieldDragEnd}
                    onDragLeave={() => { if (dragOverIndex === index) setDragOverIndex(null); }}
                    className={`flex items-start gap-2 p-3 bg-gray-50 border rounded-lg transition-all ${
                      isDragging ? 'opacity-40' : ''
                    } ${
                      isDragOver ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
                    }`}
                  >
                    {/* Drag handle */}
                    <button
                      type="button"
                      onMouseDown={() => setDraggableIndex(index)}
                      onMouseUp={() => setDraggableIndex(null)}
                      onTouchStart={() => setDraggableIndex(index)}
                      onTouchEnd={() => setDraggableIndex(null)}
                      title="Drag to reorder"
                      aria-label="Drag to reorder field"
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md cursor-grab active:cursor-grabbing mt-0.5 shrink-0 select-none"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>

                    {/* Label */}
                    <div className="w-36 shrink-0 pt-0.5">
                      {input.isPreset ? (
                        <span className="inline-block px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 w-full text-center">
                          {input.label}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={input.label}
                          onChange={(e) => updateCustomInput(index, 'label', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                          placeholder="Field name"
                        />
                      )}
                    </div>

                    {/* Value */}
                    <textarea
                      value={input.value}
                      onChange={(e) => {
                        updateCustomInput(index, 'value', e.target.value);
                        autoResize(e.target);
                      }}
                      ref={(el) => { if (el) autoResize(el); }}
                      rows={1}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none overflow-hidden bg-white"
                      placeholder={`Enter ${input.label || 'value'}...`}
                    />

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeCustomInput(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors mt-0.5 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {customInputs.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-2">
            No fields added yet. Use presets above or add a custom field below.
          </p>
        )}

        {/* Custom input button */}
        <button
          type="button"
          onClick={addCustomInput}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors w-full justify-center"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Custom Input
        </button>
      </div>

      {/* Extra Roles (Role 2, 3, ...) */}
      {extraRoles.map((role, roleIndex) => {
        const roleNumber = roleIndex + 2;
        return (
          <div key={role.id} className="bg-white border border-purple-300 ring-1 ring-purple-100 rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-xs font-bold">
                    <Users className="h-3 w-3" /> Role {roleNumber}
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Click <Copy className="inline h-3 w-3 -mt-0.5" /> next to a field to copy that value from Role 1.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => copyAllFromRole1(roleIndex)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                  title="Copy all values from Role 1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy all from Role 1
                </button>
                <button
                  type="button"
                  onClick={() => removeExtraRole(roleIndex)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>

            {/* Quick Add Preset Fields (per role) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Add Preset Fields</p>
              <div className="flex flex-wrap gap-2">
                {presetFields.map((label) => {
                  const isAdded = role.customInputs.some(ci => ci.label === label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => togglePresetForExtraRole(roleIndex, label)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-normal border transition-colors ${
                        isAdded
                          ? 'bg-primary/10 text-primary border-primary/40 hover:bg-primary/15'
                          : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-primary/5 hover:text-primary hover:border-primary'
                      }`}
                    >
                      {isAdded ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-gray-200 pt-3">
                <button
                  type="button"
                  onClick={() => addPostSetForExtraRole(roleIndex)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/15 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add All Preset Fields
                </button>
              </div>
            </div>

            {/* Fields */}
            {role.customInputs.length > 0 && (
              <div className="space-y-2">
                {role.customInputs.map((input, fieldIndex) => {
                  const role1Source = customInputs.find(ci => ci.label === input.label);
                  const canCopy = Boolean(role1Source && role1Source.value);
                  const isSynced = canCopy && role1Source!.value === input.value && input.value !== '';
                  return (
                    <div
                      key={fieldIndex}
                      className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      {/* Per-field copy button */}
                      <button
                        type="button"
                        onClick={() => copyFieldFromRole1(roleIndex, fieldIndex)}
                        disabled={!canCopy}
                        title={canCopy
                          ? (isSynced ? 'Synced with Role 1' : `Copy "${role1Source?.value}" from Role 1`)
                          : 'Role 1 has no value for this field'}
                        className={`p-1.5 rounded-md transition-colors mt-0.5 shrink-0 border ${
                          isSynced
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : canCopy
                              ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 border-dashed'
                              : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                        }`}
                      >
                        {isSynced ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>

                      {/* Label */}
                      <div className="w-36 shrink-0 pt-0.5">
                        {input.isPreset ? (
                          <span className="inline-block px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 w-full text-center">
                            {input.label}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={input.label}
                            onChange={(e) => updateExtraRoleInput(roleIndex, fieldIndex, 'label', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                            placeholder="Field name"
                          />
                        )}
                      </div>

                      {/* Value */}
                      <textarea
                        value={input.value}
                        onChange={(e) => {
                          updateExtraRoleInput(roleIndex, fieldIndex, 'value', e.target.value);
                          autoResize(e.target);
                        }}
                        ref={(el) => { if (el) autoResize(el); }}
                        rows={1}
                        className={`flex-1 px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none overflow-hidden bg-white ${
                          isSynced ? 'border-green-300 bg-green-50' : 'border-gray-300'
                        }`}
                        placeholder={`Enter ${input.label || 'value'}...`}
                      />

                      {/* Remove field */}
                      <button
                        type="button"
                        onClick={() => removeExtraRoleInput(roleIndex, fieldIndex)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors mt-0.5 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {role.customInputs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">
                No fields in this role yet. Click "Copy all from Role 1" or add a custom field below.
              </p>
            )}

            <button
              type="button"
              onClick={() => addExtraRoleInput(roleIndex)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors w-full justify-center"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Custom Input to Role {roleNumber}
            </button>
          </div>
        );
      })}

      {/* Add Another Role */}
      <button
        type="button"
        onClick={addExtraRole}
        className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-purple-700 bg-purple-50 border-2 border-dashed border-purple-300 rounded-xl hover:bg-purple-100 hover:border-purple-400 transition-colors w-full justify-center"
      >
        <Plus className="h-4 w-4" />
        Add Another Role {extraRoles.length >= 1 ? `(Role ${extraRoles.length + 2})` : '(adds Role 2)'}
      </button>
    </div>
  );
}
