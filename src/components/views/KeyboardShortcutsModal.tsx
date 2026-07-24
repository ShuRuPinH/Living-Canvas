import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);
  const shortcuts = [
    { key: 'V', desc: 'Select Tool' },
    { key: 'H', desc: 'Hand / Pan Canvas Tool' },
    { key: 'T', desc: 'Text Tool' },
    { key: 'N', desc: 'Sticky Note Tool' },
    { key: 'R', desc: 'Rectangle / Shape Tool' },
    { key: 'L', desc: 'Connection Arrow Tool' },
    { key: 'F', desc: 'Frame / Group Tool' },
    { key: 'D', desc: 'Freehand Draw Pencil Tool' },
    { key: 'Space + Drag', desc: 'Pan Canvas anywhere' },
    { key: 'Delete / Backspace', desc: 'Delete Selected Element' },
    { key: 'Cmd/Ctrl + Z', desc: 'Undo' },
    { key: 'Cmd/Ctrl + Shift + Z', desc: 'Redo' },
    { key: 'Cmd/Ctrl + D', desc: 'Duplicate Selected Element' },
    { key: 'Cmd/Ctrl + F', desc: 'Global Search Knowledge' },
    { key: 'Tab', desc: 'Add Connected Child Node' },
    { key: ']', desc: 'Bring Forward' },
    { key: '[', desc: 'Send Backward' },
    { key: 'Shift + ]', desc: 'Bring to Front' },
    { key: 'Shift + [', desc: 'Send to Back' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-base">
            <Keyboard size={20} className="text-indigo-600" />
            <span>Living Canvas Hotkeys</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto p-1">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
            >
              <span className="text-slate-600 dark:text-slate-300 font-medium">{s.desc}</span>
              <kbd className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-mono font-bold px-2 py-1 rounded shadow-2xs border border-slate-200 dark:border-slate-700">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
