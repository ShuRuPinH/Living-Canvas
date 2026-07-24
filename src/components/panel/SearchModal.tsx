import React, { useState, useMemo, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { CanvasElement, CanvasConnection } from '../../types/canvas';

interface SearchModalProps {
  elements: Record<string, CanvasElement>;
  connections: Record<string, CanvasConnection>;
  onSelectResult: (type: 'element' | 'connection', id: string) => void;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  elements,
  connections,
  onSelectResult,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  // Close modal on Escape key
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

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    const matches: {
      type: 'element' | 'connection';
      id: string;
      title: string;
      snippet: string;
      icon?: string;
    }[] = [];

    // Search elements
    (Object.values(elements) as CanvasElement[]).forEach((elem) => {
      let matchedReason = '';

      if (elem.title.toLowerCase().includes(q)) {
        matchedReason = 'Title match';
      } else if (elem.description?.toLowerCase().includes(q)) {
        matchedReason = `Description match: "${elem.description.substring(0, 40)}..."`;
      } else if (elem.tags.some((t) => t.toLowerCase().includes(q))) {
        matchedReason = `Tag match: #${q}`;
      } else if (elem.properties.some((p) => p.key.toLowerCase().includes(q) || p.value.toLowerCase().includes(q))) {
        matchedReason = `Property match`;
      } else if (elem.notes.some((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))) {
        matchedReason = `Note match`;
      } else if (elem.comments.some((c) => c.content.toLowerCase().includes(q))) {
        matchedReason = `Comment match`;
      }

      if (matchedReason) {
        matches.push({
          type: 'element',
          id: elem.id,
          title: elem.title || 'Untitled Element',
          snippet: matchedReason,
          icon: elem.icon || 'Box',
        });
      }
    });

    // Search connections
    (Object.values(connections) as CanvasConnection[]).forEach((conn) => {
      let matchedReason = '';
      if (conn.label?.toLowerCase().includes(q)) {
        matchedReason = 'Connection label match';
      } else if (conn.description?.toLowerCase().includes(q)) {
        matchedReason = 'Connection description match';
      }

      if (matchedReason) {
        matches.push({
          type: 'connection',
          id: conn.id,
          title: conn.label || 'Connection',
          snippet: matchedReason,
          icon: 'ArrowUpRight',
        });
      }
    });

    return matches;
  }, [query, elements, connections]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-24 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <LucideIcons.Search size={20} className="text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search elements, notes, properties, tags, connections..."
            autoFocus
            className="w-full text-base font-medium text-slate-900 dark:text-white bg-transparent outline-none"
          />
          <kbd className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-1 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() && results.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              No elements found matching "{query}"
            </div>
          )}

          {!query.trim() && (
            <div className="p-6 text-center text-slate-400 text-xs">
              Type to search titles, markdown notes, tags (#), custom properties, comments, or connection labels...
            </div>
          )}

          {results.map((res) => {
            const IconComp = (LucideIcons as Record<string, React.ElementType>)[res.icon || 'Box'] || LucideIcons.Box;
            return (
              <button
                key={res.id}
                onClick={() => {
                  onSelectResult(res.type, res.id);
                  onClose();
                }}
                className="w-full p-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl flex items-center justify-between text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                    <IconComp size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {res.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {res.snippet}
                    </div>
                  </div>
                </div>
                <LucideIcons.ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
