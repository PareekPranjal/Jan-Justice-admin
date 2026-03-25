import type { SidebarField } from '../../lib/api';
import { generateId } from '../../lib/jobDefaults';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SidebarFieldEditorProps {
  fields: SidebarField[];
  fixedFieldValues: Record<string, unknown>;
  onFieldsChange: (fields: SidebarField[]) => void;
  onFixedFieldChange: (key: string, value: unknown) => void;
}

export default function SidebarFieldEditor({
  fields,
  fixedFieldValues,
  onFieldsChange,
  onFixedFieldChange,
}: SidebarFieldEditorProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<SidebarField['fieldType']>('text');

  const sorted = [...fields].sort((a, b) => a.order - b.order);

  const moveField = (id: string, direction: 'up' | 'down') => {
    const idx = sorted.findIndex((f) => f.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const updated = fields.map((f) => {
      if (f.id === sorted[idx].id) return { ...f, order: sorted[swapIdx].order };
      if (f.id === sorted[swapIdx].id) return { ...f, order: sorted[idx].order };
      return f;
    });
    onFieldsChange(updated);
  };

  const deleteField = (id: string) => {
    onFieldsChange(fields.filter((f) => f.id !== id));
  };

  const addField = () => {
    if (!newLabel.trim()) return;
    const newField: SidebarField = {
      id: generateId('sf'),
      label: newLabel.trim(),
      fieldType: newType,
      value: '',
      order: fields.length,
      isDefault: false,
    };
    onFieldsChange([...fields, newField]);
    setNewLabel('');
    setNewType('text');
    setShowAdd(false);
  };

  const renderFieldInput = (field: SidebarField) => {
    if (field.fixedFieldKey) {
      const val = fixedFieldValues[field.fixedFieldKey];
      switch (field.fieldType) {
        case 'salary-range': {
          const salary = (val as { min?: number; max?: number; currency?: string }) || {};
          return (
            <div className="flex gap-2">
              <input
                type="number"
                value={salary.min || ''}
                onChange={(e) =>
                  onFixedFieldChange(field.fixedFieldKey!, {
                    ...salary,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-2 py-1.5 border rounded text-xs"
                placeholder="Min"
              />
              <input
                type="number"
                value={salary.max || ''}
                onChange={(e) =>
                  onFixedFieldChange(field.fixedFieldKey!, {
                    ...salary,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-2 py-1.5 border rounded text-xs"
                placeholder="Max"
              />
            </div>
          );
        }
        case 'experience-range': {
          const exp = (val as { min?: number; max?: number }) || {};
          return (
            <div className="flex gap-2">
              <input
                type="number"
                value={exp.min || ''}
                onChange={(e) =>
                  onFixedFieldChange(field.fixedFieldKey!, {
                    ...exp,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-2 py-1.5 border rounded text-xs"
                placeholder="Min yrs"
              />
              <input
                type="number"
                value={exp.max || ''}
                onChange={(e) =>
                  onFixedFieldChange(field.fixedFieldKey!, {
                    ...exp,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-2 py-1.5 border rounded text-xs"
                placeholder="Max yrs"
              />
            </div>
          );
        }
        case 'dropdown-single': {
          if (field.fixedFieldKey === 'employmentType') {
            return (
              <select
                value={(val as string) || ''}
                onChange={(e) => onFixedFieldChange(field.fixedFieldKey!, e.target.value)}
                className="w-full px-2 py-1.5 border rounded text-xs"
              >
                <option value="">Select</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            );
          }
          return (
            <input
              type="text"
              value={(val as string) || ''}
              onChange={(e) => onFixedFieldChange(field.fixedFieldKey!, e.target.value)}
              className="w-full px-2 py-1.5 border rounded text-xs"
              placeholder={field.label}
            />
          );
        }
        default:
          return (
            <input
              type={field.fieldType === 'number' ? 'number' : 'text'}
              value={(val as string) || ''}
              onChange={(e) => onFixedFieldChange(field.fixedFieldKey!, e.target.value)}
              className="w-full px-2 py-1.5 border rounded text-xs"
              placeholder={field.label}
            />
          );
      }
    }

    // Custom sidebar field (no fixedFieldKey)
    return (
      <input
        type={field.fieldType === 'number' ? 'number' : 'text'}
        value={(field.value as string) || ''}
        onChange={(e) => {
          onFieldsChange(
            fields.map((f) => (f.id === field.id ? { ...f, value: e.target.value } : f))
          );
        }}
        className="w-full px-2 py-1.5 border rounded text-xs"
        placeholder={field.label}
      />
    );
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Sidebar Fields</h3>
      {sorted.map((field, idx) => (
        <div key={field.id} className="border rounded-lg p-3 bg-gray-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">{field.label}</span>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => moveField(field.id, 'up')} disabled={idx === 0} className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30">
                <ChevronUp className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => moveField(field.id, 'down')} disabled={idx === sorted.length - 1} className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30">
                <ChevronDown className="h-3 w-3" />
              </button>
              {!field.isDefault && (
                <button type="button" onClick={() => deleteField(field.id)} className="p-0.5 hover:bg-red-100 rounded text-red-500">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          {renderFieldInput(field)}
        </div>
      ))}

      {showAdd ? (
        <div className="border border-dashed border-primary/30 rounded-lg p-3 space-y-2 bg-primary/5">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full px-2 py-1.5 border rounded text-xs"
            placeholder="Field label"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as SidebarField['fieldType'])}
            className="w-full px-2 py-1.5 border rounded text-xs"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={addField} disabled={!newLabel.trim()} className="px-3 py-1 bg-primary text-white rounded text-xs disabled:opacity-50">Add</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1 bg-gray-200 rounded text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="h-3 w-3" /> Add Sidebar Field
        </button>
      )}
    </div>
  );
}
