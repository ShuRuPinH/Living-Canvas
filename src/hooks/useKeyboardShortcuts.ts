import { useEffect } from 'react';
import { ToolType } from '../types/canvas';

interface KeyboardShortcutsProps {
  onSelectTool: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onOpenSearch: () => void;
  onAddChild: () => void;
}

export function useKeyboardShortcuts({
  onSelectTool,
  onUndo,
  onRedo,
  onDeleteSelected,
  onDuplicateSelected,
  onOpenSearch,
  onAddChild,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing inside inputs or textareas
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isInput) return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onRedo();
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        onDuplicateSelected();
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeleteSelected();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        onAddChild();
        return;
      }

      // Single-key tool switches
      switch (e.key.toLowerCase()) {
        case 'v':
          onSelectTool('select');
          break;
        case 'h':
          onSelectTool('pan');
          break;
        case 't':
          onSelectTool('text');
          break;
        case 'n':
          onSelectTool('sticky-note');
          break;
        case 'r':
          onSelectTool('rectangle');
          break;
        case 'l':
          onSelectTool('connection');
          break;
        case 'f':
          onSelectTool('frame');
          break;
        case 'd':
          onSelectTool('freehand');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onSelectTool,
    onUndo,
    onRedo,
    onDeleteSelected,
    onDuplicateSelected,
    onOpenSearch,
    onAddChild,
  ]);
}
