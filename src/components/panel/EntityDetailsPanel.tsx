import React, { useState, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  CanvasElement,
  CanvasConnection,
  KnowledgeObjectType,
  PropertyItem,
  NoteItem,
  CommentItem,
  AttachmentItem,
} from '../../types/canvas';
import { OBJECT_TYPE_SUGGESTIONS } from '../../constants/templates';

interface EntityDetailsPanelProps {
  element?: CanvasElement;
  connection?: CanvasConnection;
  allElements: Record<string, CanvasElement>;
  initialTab?: 'overview' | 'properties' | 'notes' | 'comments' | 'attachments' | 'connections' | 'history';
  onUpdateElement: (updated: CanvasElement) => void;
  onUpdateConnection: (updated: CanvasConnection) => void;
  onClose: () => void;
  onJumpToElement: (elementId: string) => void;
  onBringToFront?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onSendToBack?: () => void;
}

export const EntityDetailsPanel: React.FC<EntityDetailsPanelProps> = ({
  element,
  connection,
  allElements,
  initialTab = 'overview',
  onUpdateElement,
  onUpdateConnection,
  onClose,
  onJumpToElement,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'properties' | 'notes' | 'comments' | 'attachments' | 'connections' | 'history'
  >(initialTab);

  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (initialTab === 'notes') {
        setIsAddingNote(true);
      }
    }
  }, [initialTab]);

  // Close panel on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle horizontal scroll on tab wheel
  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (tabsRef.current) {
      if (e.deltaY !== 0) {
        tabsRef.current.scrollLeft += e.deltaY;
      } else if (e.deltaX !== 0) {
        tabsRef.current.scrollLeft += e.deltaX;
      }
    }
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -120 : 120,
        behavior: 'smooth',
      });
    }
  };

  // Input states for new items
  const [newTag, setNewTag] = useState('');
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropVal, setNewPropVal] = useState('');

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const [newCommentAuthor, setNewCommentAuthor] = useState('Current User');
  const [newCommentText, setNewCommentText] = useState('');

  const [newAttachName, setNewAttachName] = useState('');
  const [newAttachUrl, setNewAttachUrl] = useState('');
  const [newAttachType, setNewAttachType] = useState<'url' | 'image' | 'file'>('url');
  const [schemaToast, setSchemaToast] = useState<string | null>(null);

  if (!element && !connection) return null;

  // Render Icon helper
  const renderIcon = (iconName?: string, size = 18) => {
    if (!iconName) return null;
    const IconComp = (LucideIcons as Record<string, React.ElementType>)[iconName];
    if (!IconComp) return null;
    return <IconComp size={size} />;
  };

  // Log action helper
  const addHistoryLog = (elem: CanvasElement, action: string, details: string): CanvasElement => {
    return {
      ...elem,
      history: [
        {
          id: `h-${Date.now()}`,
          action,
          details,
          timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          actor: 'Current User',
        },
        ...(elem.history || []),
      ],
    };
  };

  // ELEMENT UPDATERS
  const handleTypeChange = (type: KnowledgeObjectType) => {
    if (!element) return;
    let updated = { ...element, objectType: type };
    updated = addHistoryLog(
      updated,
      'Type Changed',
      type ? `Changed object type to ${type}` : 'Cleared object type'
    );
    onUpdateElement(updated);
  };

  const handleApplySuggestedProperties = () => {
    if (!element) return;
    const objectTypeKey = element.objectType || 'Generic';
    const suggestions =
      OBJECT_TYPE_SUGGESTIONS[objectTypeKey] || OBJECT_TYPE_SUGGESTIONS['Generic'] || [];
    const existingKeys = new Set((element.properties || []).map((p) => p.key));

    const newProps: PropertyItem[] = [...(element.properties || [])];
    let addedCount = 0;
    suggestions.forEach((s) => {
      if (!existingKeys.has(s.key)) {
        newProps.push({
          id: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          key: s.key,
          value: s.defaultValue,
        });
        addedCount++;
      }
    });

    let updated = { ...element, properties: newProps };
    updated = addHistoryLog(
      updated,
      'Properties Added',
      `Applied schema suggestions for ${objectTypeKey || 'Generic'}`
    );
    onUpdateElement(updated);
    setActiveTab('properties');
    setSchemaToast(
      addedCount > 0
        ? `Added ${addedCount} schema property suggestions!`
        : 'All suggested schema properties are already present!'
    );
    setTimeout(() => setSchemaToast(null), 3500);
  };

  const handleAddTag = () => {
    if (!element || !newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    if (!element.tags.includes(tag)) {
      const updated = addHistoryLog(
        { ...element, tags: [...element.tags, tag] },
        'Tag Added',
        `Added tag #${tag}`
      );
      onUpdateElement(updated);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    if (!element) return;
    const updated = addHistoryLog(
      { ...element, tags: element.tags.filter((t) => t !== tag) },
      'Tag Removed',
      `Removed tag #${tag}`
    );
    onUpdateElement(updated);
  };

  const handleAddProperty = () => {
    if (!element || !newPropKey.trim()) return;
    const newProp: PropertyItem = {
      id: `prop-${Date.now()}`,
      key: newPropKey.trim(),
      value: newPropVal.trim(),
    };
    const updated = addHistoryLog(
      { ...element, properties: [...element.properties, newProp] },
      'Property Added',
      `Added property ${newPropKey}`
    );
    onUpdateElement(updated);
    setNewPropKey('');
    setNewPropVal('');
  };

  const handleRemoveProperty = (propId: string) => {
    if (!element) return;
    const updated = addHistoryLog(
      { ...element, properties: element.properties.filter((p) => p.id !== propId) },
      'Property Deleted',
      'Deleted a custom property'
    );
    onUpdateElement(updated);
  };

  const handleUpdatePropertyValue = (propId: string, val: string) => {
    if (!element) return;
    const updated = {
      ...element,
      properties: element.properties.map((p) => (p.id === propId ? { ...p, value: val } : p)),
    };
    onUpdateElement(updated);
  };

  const handleAddNote = () => {
    if (!element || !newNoteTitle.trim()) return;
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteContent,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };
    const updated = addHistoryLog(
      { ...element, notes: [newNote, ...element.notes] },
      'Note Added',
      `Added note "${newNoteTitle}"`
    );
    onUpdateElement(updated);
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  const handleDeleteNote = (noteId: string) => {
    if (!element) return;
    const updated = addHistoryLog(
      { ...element, notes: element.notes.filter((n) => n.id !== noteId) },
      'Note Deleted',
      'Removed a note'
    );
    onUpdateElement(updated);
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;

    const newComment: CommentItem = {
      id: `comment-${Date.now()}`,
      author: newCommentAuthor || 'Anonymous',
      content: newCommentText.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (element) {
      const updated = addHistoryLog(
        { ...element, comments: [newComment, ...element.comments] },
        'Comment Added',
        'Posted a comment'
      );
      onUpdateElement(updated);
    } else if (connection) {
      onUpdateConnection({ ...connection, comments: [newComment, ...connection.comments] });
    }

    setNewCommentText('');
  };

  const handleAddAttachment = () => {
    if (!element || !newAttachName.trim() || !newAttachUrl.trim()) return;
    const newAttach: AttachmentItem = {
      id: `attach-${Date.now()}`,
      name: newAttachName.trim(),
      type: newAttachType,
      url: newAttachUrl.trim(),
      uploadedAt: new Date().toLocaleDateString(),
    };
    const updated = addHistoryLog(
      { ...element, attachments: [...element.attachments, newAttach] },
      'Attachment Added',
      `Attached ${newAttachName}`
    );
    onUpdateElement(updated);
    setNewAttachName('');
    setNewAttachUrl('');
  };

  const handleDeleteAttachment = (attachId: string) => {
    if (!element) return;
    const updated = addHistoryLog(
      { ...element, attachments: element.attachments.filter((a) => a.id !== attachId) },
      'Attachment Removed',
      'Deleted attachment'
    );
    onUpdateElement(updated);
  };

  // Find connections for this element
  const relatedConnections = element
    ? Object.values(allElements ? {} : {}).concat([]) // placeholder logic
    : [];

  return (
    <aside
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="fixed top-16 right-4 bottom-4 w-96 z-[60] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col select-none animate-in slide-in-from-right duration-200 text-slate-800 dark:text-slate-100 overflow-hidden pointer-events-auto"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex-1 pr-2">
          {element ? (
            <div className="flex items-center gap-2">
              {renderIcon(element.icon, 20)}
              <input
                type="text"
                value={element.title}
                onChange={(e) =>
                  onUpdateElement(addHistoryLog({ ...element, title: e.target.value }, 'Title Updated', e.target.value))
                }
                className="font-bold text-lg text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full"
                placeholder="Entity Title..."
              />
            </div>
          ) : (
            <div>
              <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                Connection
              </div>
              <input
                type="text"
                value={connection?.label || ''}
                onChange={(e) =>
                  connection && onUpdateConnection({ ...connection, label: e.target.value })
                }
                className="font-bold text-base text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full"
                placeholder="Connection Label..."
              />
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close details (Esc)"
        >
          <LucideIcons.X size={18} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="relative flex items-center bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs px-1 py-1">
        <button
          onClick={() => scrollTabs('left')}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-md transition-colors shrink-0 cursor-pointer"
          title="Scroll left"
        >
          <LucideIcons.ChevronLeft size={14} />
        </button>

        <div
          ref={tabsRef}
          onWheel={handleTabsWheel}
          className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scroll-smooth px-1 py-0.5 max-w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'properties', label: 'Properties', count: element?.properties.length },
            { id: 'notes', label: 'Notes', count: element?.notes.length },
            { id: 'comments', label: 'Comments', count: element?.comments.length || connection?.comments.length },
            { id: 'attachments', label: 'Files', count: element?.attachments.length },
            { id: 'history', label: 'History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => scrollTabs('right')}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-md transition-colors shrink-0 cursor-pointer"
          title="Scroll right"
        >
          <LucideIcons.ChevronRight size={14} />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && element && (
          <div className="space-y-4">
            {/* Object Type Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-500 dark:text-slate-400">
                  Knowledge Object Type
                </label>
                <button
                  onClick={handleApplySuggestedProperties}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  title="Auto-add suggested properties schema for this object type"
                >
                  <LucideIcons.Sparkles size={12} className="text-amber-500" />
                  <span>Suggest Schema Props</span>
                </button>
              </div>
              <select
                value={element.objectType || ''}
                onChange={(e) => handleTypeChange(e.target.value as KnowledgeObjectType)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <option value="">— Not Specified (Empty) —</option>
                {[
                  'Generic',
                  'Microservice',
                  'Database',
                  'Person',
                  'Project',
                  'Task',
                  'Event',
                  'Document',
                  'Idea',
                  'Device',
                  'Custom',
                ].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Text Area */}
            <div>
              <label className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Description / RFC Summary
              </label>
              <textarea
                value={element.description || ''}
                onChange={(e) =>
                  onUpdateElement({ ...element, description: e.target.value })
                }
                rows={4}
                placeholder="Write a clear summary, architecture note, or purpose..."
                className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none resize-none leading-relaxed font-sans"
              />
            </div>

            {/* Tags Manager */}
            <div>
              <label className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Tags & Topics
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {element.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full font-medium"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag (e.g. backend, RFC)..."
                  className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Layer Ordering Controls */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                Layer Order (Z-Index: {element.zIndex ?? 1})
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={onBringToFront}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-[11px] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  title="Bring to Front (Shift + ])"
                >
                  <LucideIcons.BringToFront size={16} />
                  <span className="mt-1">To Front</span>
                </button>

                <button
                  onClick={onBringForward}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-[11px] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  title="Bring Forward (])"
                >
                  <LucideIcons.ArrowUp size={16} />
                  <span className="mt-1">Forward</span>
                </button>

                <button
                  onClick={onSendBackward}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-[11px] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  title="Send Backward ([)"
                >
                  <LucideIcons.ArrowDown size={16} />
                  <span className="mt-1">Backward</span>
                </button>

                <button
                  onClick={onSendToBack}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-[11px] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  title="Send to Back (Shift + [)"
                >
                  <LucideIcons.SendToBack size={16} />
                  <span className="mt-1">To Back</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM PROPERTIES TAB */}
        {activeTab === 'properties' && element && (
          <div className="space-y-4">
            {schemaToast && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-xl font-medium text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <LucideIcons.CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{schemaToast}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Properties ({element.properties.length})
              </span>
              <button
                onClick={handleApplySuggestedProperties}
                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Auto-populate recommended properties schema"
              >
                <LucideIcons.Sparkles size={13} className="text-amber-500" />
                <span>Suggest Schema Props</span>
              </button>
            </div>

            <div className="space-y-2">
              {element.properties.length === 0 ? (
                <div className="p-4 text-center text-slate-400 border border-dashed rounded-xl">
                  No custom properties added yet.
                </div>
              ) : (
                element.properties.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <span className="font-semibold text-slate-600 dark:text-slate-300 w-28 truncate">
                      {p.key}:
                    </span>
                    <input
                      type="text"
                      value={p.value}
                      onChange={(e) => handleUpdatePropertyValue(p.id, e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 outline-none font-mono"
                    />
                    <button
                      onClick={() => handleRemoveProperty(p.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <LucideIcons.Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Property Form */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-semibold text-slate-700 dark:text-slate-200">Add Key-Value Property</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newPropKey}
                  onChange={(e) => setNewPropKey(e.target.value)}
                  placeholder="Key (e.g. Status)"
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                />
                <input
                  type="text"
                  value={newPropVal}
                  onChange={(e) => setNewPropVal(e.target.value)}
                  placeholder="Value (e.g. Active)"
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                />
              </div>
              <button
                onClick={handleAddProperty}
                className="w-full py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500"
              >
                + Add Property
              </button>
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && element && (
          <div className="space-y-4">
            <button
              onClick={() => setIsAddingNote(!isAddingNote)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <LucideIcons.Plus size={16} />
              <span>{isAddingNote ? 'Cancel Note' : 'Add Structured Note'}</span>
            </button>

            {isAddingNote && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2">
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                />
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={4}
                  placeholder="Note content (Markdown supported)..."
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none resize-none font-mono"
                />
                <button
                  onClick={handleAddNote}
                  className="w-full py-1.5 bg-indigo-600 text-white font-semibold rounded-lg"
                >
                  Save Note
                </button>
              </div>
            )}

            <div className="space-y-3">
              {element.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{note.title}</span>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <LucideIcons.Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                    {note.createdAt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMMENTS TAB */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <input
                type="text"
                value={newCommentAuthor}
                onChange={(e) => setNewCommentAuthor(e.target.value)}
                placeholder="Your Name..."
                className="w-full px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 rounded-lg"
              />
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={3}
                placeholder="Post a comment or discussion thought..."
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 rounded-xl outline-none resize-none"
              />
              <button
                onClick={handleAddComment}
                className="w-full py-1.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500"
              >
                Post Comment
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {((element ? element.comments : connection?.comments) || []).map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-indigo-600 dark:text-indigo-400">{c.author}</span>
                    <span className="text-[10px] text-slate-400">{c.createdAt}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ATTACHMENTS TAB */}
        {activeTab === 'attachments' && element && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-semibold text-slate-700 dark:text-slate-200">Attach File or Link</div>
              <input
                type="text"
                value={newAttachName}
                onChange={(e) => setNewAttachName(e.target.value)}
                placeholder="Attachment Label (e.g. Figma Specs)"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg outline-none"
              />
              <input
                type="text"
                value={newAttachUrl}
                onChange={(e) => setNewAttachUrl(e.target.value)}
                placeholder="URL link or Image URL..."
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg outline-none font-mono"
              />
              <button
                onClick={handleAddAttachment}
                className="w-full py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500"
              >
                Attach
              </button>
            </div>

            <div className="space-y-2">
              {element.attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <LucideIcons.Link size={14} className="text-indigo-500 shrink-0" />
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline text-indigo-600 dark:text-indigo-400 truncate"
                    >
                      {a.name}
                    </a>
                  </div>
                  <button
                    onClick={() => handleDeleteAttachment(a.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <LucideIcons.Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && element && (
          <div className="space-y-2">
            {(element.history || []).map((h) => (
              <div
                key={h.id}
                className="p-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-0.5"
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{h.action}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{h.timestamp}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">{h.details}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
