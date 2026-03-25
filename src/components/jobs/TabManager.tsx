import type { JobTab } from '../../lib/api';
import { generateId } from '../../lib/jobDefaults';
import { Plus, X, ChevronLeft, ChevronRight, Pencil, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface TabManagerProps {
  tabs: JobTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabsChange: (tabs: JobTab[]) => void;
}

export default function TabManager({ tabs, activeTabId, onTabSelect, onTabsChange }: TabManagerProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const sorted = [...tabs].sort((a, b) => a.order - b.order);

  const addTab = () => {
    const newTab: JobTab = {
      id: generateId('tab'),
      label: 'New Tab',
      order: tabs.length,
      isDefault: false,
      sections: [],
    };
    onTabsChange([...tabs, newTab]);
    onTabSelect(newTab.id);
  };

  const deleteTab = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab?.isDefault) return;
    const remaining = tabs.filter((t) => t.id !== tabId);
    onTabsChange(remaining);
    if (activeTabId === tabId && remaining.length > 0) {
      onTabSelect(remaining[0].id);
    }
  };

  const moveTab = (tabId: string, direction: 'left' | 'right') => {
    const idx = sorted.findIndex((t) => t.id === tabId);
    const swapIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const updated = tabs.map((t) => {
      if (t.id === sorted[idx].id) return { ...t, order: sorted[swapIdx].order };
      if (t.id === sorted[swapIdx].id) return { ...t, order: sorted[idx].order };
      return t;
    });
    onTabsChange(updated);
  };

  const startEdit = (tab: JobTab) => {
    setEditingTabId(tab.id);
    setEditLabel(tab.label);
  };

  const saveEdit = () => {
    if (!editingTabId || !editLabel.trim()) return;
    onTabsChange(tabs.map((t) => (t.id === editingTabId ? { ...t, label: editLabel.trim() } : t)));
    setEditingTabId(null);
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b">
      {sorted.map((tab, idx) => (
        <div
          key={tab.id}
          className={cn(
            'group relative flex items-center gap-1 px-3 py-2 rounded-t-lg text-sm font-medium cursor-pointer whitespace-nowrap transition-colors',
            activeTabId === tab.id
              ? 'bg-white border border-b-white text-primary -mb-px z-10'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          )}
          onClick={() => onTabSelect(tab.id)}
        >
          {editingTabId === tab.id ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                className="w-24 px-1 py-0.5 text-sm border rounded"
                autoFocus
              />
              <button type="button" onClick={saveEdit} className="p-0.5 hover:bg-gray-200 rounded">
                <Check className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <>
              <span>{tab.label}</span>
              <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                {idx > 0 && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveTab(tab.id, 'left'); }} className="p-0.5 hover:bg-gray-200 rounded">
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                )}
                {idx < sorted.length - 1 && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveTab(tab.id, 'right'); }} className="p-0.5 hover:bg-gray-200 rounded">
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
                <button type="button" onClick={(e) => { e.stopPropagation(); startEdit(tab); }} className="p-0.5 hover:bg-gray-200 rounded">
                  <Pencil className="h-3 w-3" />
                </button>
                {!tab.isDefault && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); deleteTab(tab.id); }} className="p-0.5 hover:bg-red-100 rounded text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addTab}
        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-primary hover:bg-gray-100 rounded-t-lg transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Tab
      </button>
    </div>
  );
}
