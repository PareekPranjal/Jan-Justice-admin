import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../lib/api';
import type { BlogSection } from '../lib/api';
import {
  ArrowLeft, Save, Trash2, Loader2, Plus, X, Upload, Star, GripVertical,
  Heading1, AlignLeft, ImageIcon, CheckCircle,
} from 'lucide-react';

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [image, setImage] = useState<{ url: string; publicId: string } | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [isImageDragging, setIsImageDragging] = useState(false);
  const [sections, setSections] = useState<BlogSection[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Drag-to-reorder state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggableIndex, setDraggableIndex] = useState<number | null>(null);

  const { data: blog, isLoading } = useQuery({
    queryKey: ['blog', id],
    queryFn: () => adminApi.getBlog(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (blog) {
      setTitle(blog.title || '');
      setExcerpt(blog.excerpt || '');
      setImage(blog.image?.url ? { url: blog.image.url, publicId: blog.image.publicId || '' } : null);
      setSections(blog.sections || []);
      setIsPublished(blog.isPublished !== false);
      setIsFeatured(Boolean(blog.isFeatured));
    }
  }, [blog]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        image: image ? { url: image.url, publicId: image.publicId } : undefined,
        sections: sections.filter(s => s.text.trim()),
        isPublished,
        isFeatured,
      };
      if (isEditing && id) return adminApi.updateBlog(id, payload);
      return adminApi.createBlog(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      navigate('/blogs');
    },
    onError: (err: Error) => alert(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteBlog(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      navigate('/blogs');
    },
  });

  // Auto-resize textarea helper
  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  // Image upload handler (used by file input + drag-and-drop)
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be 10MB or smaller.');
      return;
    }
    setImageUploading(true);
    try {
      const result = await adminApi.uploadBlogImage(file);
      setImage(result);
    } catch {
      alert('Image upload failed. Please try again.');
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Section helpers
  const addSection = (type: 'heading' | 'paragraph') => {
    setSections([...sections, { type, text: '' }]);
  };

  const updateSection = (index: number, text: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], text };
    setSections(updated);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const reorderSections = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const updated = [...sections];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setSections(updated);
  };

  const handleDragStart = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    if (draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedIndex !== null) reorderSections(draggedIndex, index);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggableIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggableIndex(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/blogs')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Article' : 'Create Article'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEditing ? 'Update article details' : 'Write a new Legal News article'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && (
            <button
              onClick={() => {
                if (confirm('Delete this article?')) deleteMutation.mutate();
              }}
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || imageUploading || !title.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saveMutation.isPending || imageUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {imageUploading ? 'Uploading...' : isEditing ? 'Update Article' : 'Save Article'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border rounded-xl p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="Article title"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => {
              setExcerpt(e.target.value);
              autoResize(e.target);
            }}
            ref={(el) => { if (el) autoResize(el); }}
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none overflow-hidden"
            placeholder="Short preview shown on the article list (optional)"
          />
          <p className="text-xs text-gray-400 mt-1">{excerpt.length}/500</p>
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageFile(file);
            }}
            className="hidden"
          />

          {imageUploading ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
              <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
              <p className="text-sm text-gray-600">Uploading image...</p>
            </div>
          ) : image ? (
            <div className="relative inline-block">
              <img src={image.url} alt="Cover" className="rounded-lg max-h-60 border" />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs bg-white/90 backdrop-blur border border-gray-200 rounded-md font-medium hover:bg-white transition-colors flex items-center gap-1"
                >
                  <Upload className="h-3 w-3" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="px-2 py-1.5 text-xs bg-white/90 backdrop-blur border border-gray-200 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-1 bg-green-50/90 backdrop-blur text-green-700 text-xs rounded-md border border-green-200">
                <CheckCircle className="h-3 w-3" />
                Uploaded
              </div>
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
                e.preventDefault(); e.stopPropagation();
                setIsImageDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault(); e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
                if (!isImageDragging) setIsImageDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault(); e.stopPropagation();
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setIsImageDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault(); e.stopPropagation();
                setIsImageDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleImageFile(file);
              }}
              className={`w-full py-8 border-2 border-dashed rounded-lg text-sm transition-colors flex flex-col items-center gap-2 cursor-pointer ${
                isImageDragging
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-300 text-gray-500 hover:border-primary hover:text-primary'
              }`}
            >
              <ImageIcon className="h-6 w-6" />
              <span>{isImageDragging ? 'Drop image here' : 'Click or drag image to upload'}</span>
              <span className="text-xs text-gray-400">Max 10MB</span>
            </div>
          )}
        </div>

        {/* Status toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
            isPublished ? 'border-primary/40 bg-primary/5' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Published</p>
              <p className="text-xs text-gray-500">Visible on the public website</p>
            </div>
          </label>
          <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
            isFeatured ? 'border-amber-300 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 inline-flex items-center gap-1.5">
                <Star className={`h-4 w-4 ${isFeatured ? 'text-amber-500 fill-current' : 'text-gray-400'}`} />
                Featured on home page
              </p>
              <p className="text-xs text-gray-500">Top 3 featured articles show on the home page</p>
            </div>
          </label>
        </div>
      </div>

      {/* Content blocks */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Content</h3>
            <p className="text-xs text-gray-400 mt-0.5">Add headings and paragraphs in any order. Drag to reorder.</p>
          </div>
        </div>

        {sections.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No content blocks yet. Add a heading or paragraph below.
          </p>
        )}

        {sections.length > 0 && (
          <div className="max-h-[600px] overflow-y-auto pr-1 space-y-2">
            {sections.map((section, index) => {
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index && draggedIndex !== index;
              return (
                <div
                  key={index}
                  draggable={draggableIndex === index}
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleDragOver(index)}
                  onDrop={handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  onDragLeave={() => { if (dragOverIndex === index) setDragOverIndex(null); }}
                  className={`flex items-start gap-2 p-3 bg-gray-50 border rounded-lg transition-all ${
                    isDragging ? 'opacity-40' : ''
                  } ${isDragOver ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}`}
                >
                  <button
                    type="button"
                    onMouseDown={() => setDraggableIndex(index)}
                    onMouseUp={() => setDraggableIndex(null)}
                    onTouchStart={() => setDraggableIndex(index)}
                    onTouchEnd={() => setDraggableIndex(null)}
                    title="Drag to reorder"
                    aria-label="Drag to reorder block"
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md cursor-grab active:cursor-grabbing mt-0.5 shrink-0 select-none"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>

                  <div className="w-28 shrink-0 pt-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold w-full justify-center ${
                      section.type === 'heading'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {section.type === 'heading' ? <Heading1 className="h-3 w-3" /> : <AlignLeft className="h-3 w-3" />}
                      {section.type === 'heading' ? 'Heading' : 'Paragraph'}
                    </span>
                  </div>

                  {section.type === 'heading' ? (
                    <input
                      type="text"
                      value={section.text}
                      onChange={(e) => updateSection(index, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-base font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                      placeholder="Heading text..."
                    />
                  ) : (
                    <textarea
                      value={section.text}
                      onChange={(e) => {
                        updateSection(index, e.target.value);
                        autoResize(e.target);
                      }}
                      ref={(el) => { if (el) autoResize(el); }}
                      rows={2}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none overflow-hidden bg-white"
                      placeholder="Paragraph text..."
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors mt-0.5 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add block buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={() => addSection('heading')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <Heading1 className="h-4 w-4" />
            Add Heading
          </button>
          <button
            type="button"
            onClick={() => addSection('paragraph')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <AlignLeft className="h-4 w-4" />
            Add Paragraph
          </button>
        </div>
      </div>
    </div>
  );
}
