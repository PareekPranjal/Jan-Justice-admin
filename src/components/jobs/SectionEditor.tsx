import type { TabSection, CustomField } from '../../lib/api';
import FixedFieldEditor from './FixedFieldEditor';
import CustomFieldList from './CustomFieldList';
import { ChevronUp, ChevronDown, Trash2, GripVertical } from 'lucide-react';

interface SectionEditorProps {
  section: TabSection;
  fixedFieldValues: Record<string, unknown>;
  onFixedFieldChange: (key: string, value: unknown) => void;
  onSectionUpdate: (sectionId: string, updates: Partial<TabSection>) => void;
  onSectionDelete: (sectionId: string) => void;
  onSectionMove: (sectionId: string, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
  pdfFile: File | null;
  imageFile: File | null;
  onPdfChange: (file: File | null) => void;
  onImageChange: (file: File | null) => void;
}

export default function SectionEditor({
  section,
  fixedFieldValues,
  onFixedFieldChange,
  onSectionUpdate,
  onSectionDelete,
  onSectionMove,
  isFirst,
  isLast,
  pdfFile,
  imageFile,
  onPdfChange,
  onImageChange,
}: SectionEditorProps) {
  return (
    <div className="border rounded-xl bg-white shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50/50 rounded-t-xl">
        <GripVertical className="h-4 w-4 text-gray-400" />
        <div className="flex-1 space-y-1">
          <input
            type="text"
            value={section.heading || ''}
            onChange={(e) => onSectionUpdate(section.id, { heading: e.target.value })}
            className="w-full text-sm font-semibold bg-transparent border-none focus:outline-none focus:ring-0 p-0"
            placeholder="Section Heading"
          />
          <input
            type="text"
            value={section.subheading || ''}
            onChange={(e) => onSectionUpdate(section.id, { subheading: e.target.value })}
            className="w-full text-xs text-gray-500 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
            placeholder="Optional subheading"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSectionMove(section.id, 'up')}
            disabled={isFirst}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onSectionMove(section.id, 'down')}
            disabled={isLast}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onSectionDelete(section.id)}
            className="p-1 hover:bg-red-100 rounded text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {section.contentType === 'fixed-field-map' && section.fixedFieldKey ? (
          <FixedFieldEditor
            fixedFieldKey={section.fixedFieldKey}
            value={fixedFieldValues[section.fixedFieldKey]}
            onChange={onFixedFieldChange}
            pdfFile={pdfFile}
            imageFile={imageFile}
            onPdfChange={onPdfChange}
            onImageChange={onImageChange}
          />
        ) : (
          <CustomFieldList
            fields={section.customFields || []}
            onChange={(fields: CustomField[]) =>
              onSectionUpdate(section.id, { customFields: fields })
            }
          />
        )}
      </div>
    </div>
  );
}
