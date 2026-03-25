import type { CustomField } from '../../lib/api';
import RichTextEditor from './RichTextEditor';
import { Trash2, Settings, X, Check } from 'lucide-react';
import { useState } from 'react';

interface DynamicFieldRendererProps {
  field: CustomField;
  onChange: (id: string, value: unknown) => void;
  onDelete: (id: string) => void;
  onUpdateConfig: (id: string, updates: Partial<CustomField>) => void;
}

export default function DynamicFieldRenderer({ field, onChange, onDelete, onUpdateConfig }: DynamicFieldRendererProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [configLabel, setConfigLabel] = useState(field.label);
  const [configOptions, setConfigOptions] = useState(field.options?.join('\n') || '');

  const saveConfig = () => {
    const updates: Partial<CustomField> = { label: configLabel };
    if (field.fieldType === 'dropdown-single' || field.fieldType === 'dropdown-multi') {
      updates.options = configOptions.split('\n').filter(Boolean);
    }
    onUpdateConfig(field.id, updates);
    setShowConfig(false);
  };

  const renderInput = () => {
    switch (field.fieldType) {
      case 'text':
        return (
          <input
            type="text"
            value={(field.value as string) || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder={`Enter ${field.label}`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={(field.value as number) || ''}
            onChange={(e) => onChange(field.id, e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder={`Enter ${field.label}`}
          />
        );
      case 'textarea':
        return (
          <textarea
            value={(field.value as string) || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
            placeholder={`Enter ${field.label}`}
          />
        );
      case 'richtext':
        return (
          <RichTextEditor
            value={(field.value as string) || ''}
            onChange={(html) => onChange(field.id, html)}
            placeholder={`Enter ${field.label}`}
          />
        );
      case 'dropdown-single':
        return (
          <select
            value={(field.value as string) || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'dropdown-multi': {
        const selected = Array.isArray(field.value) ? (field.value as string[]) : [];
        return (
          <div className="space-y-1">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={(e) => {
                    const newVal = e.target.checked
                      ? [...selected, opt]
                      : selected.filter((v) => v !== opt);
                    onChange(field.id, newVal);
                  }}
                  className="rounded border-gray-300"
                />
                {opt}
              </label>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="relative group border rounded-lg p-4 bg-gray-50/50">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          <span className="ml-2 text-xs text-gray-400">({field.fieldType})</span>
        </label>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => setShowConfig(!showConfig)} className="p-1 hover:bg-gray-200 rounded">
            <Settings className="h-3.5 w-3.5 text-gray-500" />
          </button>
          <button type="button" onClick={() => onDelete(field.id)} className="p-1 hover:bg-red-100 rounded">
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="mb-3 p-3 bg-white border rounded-lg space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-600">Label</label>
            <input
              type="text"
              value={configLabel}
              onChange={(e) => setConfigLabel(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm mt-1"
            />
          </div>
          {(field.fieldType === 'dropdown-single' || field.fieldType === 'dropdown-multi') && (
            <div>
              <label className="text-xs font-medium text-gray-600">Options (one per line)</label>
              <textarea
                value={configOptions}
                onChange={(e) => setConfigOptions(e.target.value)}
                rows={3}
                className="w-full px-2 py-1 border rounded text-sm mt-1"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={saveConfig} className="flex items-center gap-1 px-2 py-1 bg-primary text-white rounded text-xs">
              <Check className="h-3 w-3" /> Save
            </button>
            <button type="button" onClick={() => setShowConfig(false)} className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded text-xs">
              <X className="h-3 w-3" /> Cancel
            </button>
          </div>
        </div>
      )}

      {renderInput()}
    </div>
  );
}
