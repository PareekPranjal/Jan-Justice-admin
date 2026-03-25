import { useState } from 'react';
import type { CustomField } from '../../lib/api';
import DynamicFieldRenderer from './DynamicFieldRenderer';
import { generateId } from '../../lib/jobDefaults';
import { Plus, X } from 'lucide-react';

interface CustomFieldListProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'richtext', label: 'Rich Text' },
  { value: 'dropdown-single', label: 'Dropdown (Single)' },
  { value: 'dropdown-multi', label: 'Dropdown (Multi)' },
] as const;

export default function CustomFieldList({ fields, onChange }: CustomFieldListProps) {
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomField['fieldType']>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const addField = () => {
    if (!newFieldLabel.trim()) return;
    const newField: CustomField = {
      id: generateId('cf'),
      label: newFieldLabel.trim(),
      fieldType: newFieldType,
      value: newFieldType === 'dropdown-multi' ? [] : '',
      options: (newFieldType === 'dropdown-single' || newFieldType === 'dropdown-multi')
        ? newFieldOptions.split('\n').filter(Boolean)
        : undefined,
      order: fields.length,
    };
    onChange([...fields, newField]);
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldOptions('');
    setShowAddField(false);
  };

  const updateFieldValue = (id: string, value: unknown) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, value } : f)));
  };

  const deleteField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  const updateFieldConfig = (id: string, updates: Partial<CustomField>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  return (
    <div className="space-y-3">
      {fields
        .sort((a, b) => a.order - b.order)
        .map((field) => (
          <DynamicFieldRenderer
            key={field.id}
            field={field}
            onChange={updateFieldValue}
            onDelete={deleteField}
            onUpdateConfig={updateFieldConfig}
          />
        ))}

      {showAddField ? (
        <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Add Custom Field</h4>
            <button type="button" onClick={() => setShowAddField(false)} className="p-1 hover:bg-gray-200 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Field Label</label>
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                placeholder="e.g. Preferred Language"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Field Type</label>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as CustomField['fieldType'])}
                className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
            </div>
          </div>
          {(newFieldType === 'dropdown-single' || newFieldType === 'dropdown-multi') && (
            <div>
              <label className="text-xs font-medium text-gray-600">Options (one per line)</label>
              <textarea
                value={newFieldOptions}
                onChange={(e) => setNewFieldOptions(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}
          <button
            type="button"
            onClick={addField}
            disabled={!newFieldLabel.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Field
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddField(true)}
          className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Custom Field
        </button>
      )}
    </div>
  );
}
