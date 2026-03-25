import { Plus, Trash2, Upload, FileText, Image } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface FixedFieldEditorProps {
  fixedFieldKey: string;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  pdfFile: File | null;
  imageFile: File | null;
  onPdfChange: (file: File | null) => void;
  onImageChange: (file: File | null) => void;
}

export default function FixedFieldEditor({
  fixedFieldKey,
  value,
  onChange,
  pdfFile,
  imageFile,
  onPdfChange,
  onImageChange,
}: FixedFieldEditorProps) {
  switch (fixedFieldKey) {
    case 'detailedDescription':
      return (
        <RichTextEditor
          value={(value as string) || ''}
          onChange={(html) => onChange(fixedFieldKey, html)}
          placeholder="Write a detailed description of the role..."
        />
      );

    case 'responsibilities':
    case 'qualifications':
    case 'benefits':
    case 'skills': {
      const items = Array.isArray(value) ? (value as string[]) : [];
      const label = fixedFieldKey === 'skills' ? 'skill' : fixedFieldKey.slice(0, -1);
      return (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const updated = [...items];
                  updated[idx] = e.target.value;
                  onChange(fixedFieldKey, updated);
                }}
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder={`Enter ${label}`}
              />
              <button
                type="button"
                onClick={() => onChange(fixedFieldKey, items.filter((_, i) => i !== idx))}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange(fixedFieldKey, [...items, ''])}
            className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg border border-dashed border-primary/30"
          >
            <Plus className="h-4 w-4" />
            Add {label}
          </button>
        </div>
      );
    }

    case 'jobDescriptionPdf': {
      const pdfData = value as { url?: string; filename?: string; size?: number } | null;
      return (
        <div className="space-y-3">
          {(pdfFile || pdfData?.url) && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <FileText className="h-5 w-5 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 truncate">
                  {pdfFile?.name || pdfData?.filename || 'Uploaded PDF'}
                </p>
                <p className="text-xs text-blue-600">
                  {pdfFile
                    ? `${(pdfFile.size / 1024).toFixed(1)} KB (new file)`
                    : pdfData?.size
                    ? `${(pdfData.size / 1024).toFixed(1)} KB`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onPdfChange(null);
                  onChange(fixedFieldKey, null);
                }}
                className="p-1 hover:bg-blue-100 rounded"
              >
                <Trash2 className="h-4 w-4 text-blue-600" />
              </button>
            </div>
          )}
          <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-500">Click to upload PDF (max 10MB)</span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                onPdfChange(file);
              }}
            />
          </label>
        </div>
      );
    }

    case 'companyImage': {
      const imgData = value as { url?: string; filename?: string } | null;
      const previewUrl = imageFile
        ? URL.createObjectURL(imageFile)
        : imgData?.url
        ? `http://localhost:5001${imgData.url}`
        : null;
      return (
        <div className="space-y-3">
          {previewUrl && (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Company"
                className="w-full max-h-48 object-contain rounded-lg border bg-gray-50"
              />
              <button
                type="button"
                onClick={() => {
                  onImageChange(null);
                  onChange(fixedFieldKey, null);
                }}
                className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 rounded-full shadow"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          )}
          <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
            <Image className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-500">Click to upload company image (max 10MB)</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                onImageChange(file);
              }}
            />
          </label>
        </div>
      );
    }

    default:
      return (
        <div className="text-sm text-gray-500 italic">
          Unknown fixed field: {fixedFieldKey}
        </div>
      );
  }
}
