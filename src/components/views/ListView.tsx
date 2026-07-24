import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { CanvasElement, CanvasConnection } from '../../types/canvas';

interface ListViewProps {
  elements: Record<string, CanvasElement>;
  connections: Record<string, CanvasConnection>;
  onSelectElement: (elem: CanvasElement) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  elements,
  connections,
  onSelectElement,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const elemList = Object.values(elements) as CanvasElement[];

  const filteredList = elemList.filter((elem) => {
    if (filterType !== 'all' && (elem.objectType || 'Generic') !== filterType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        elem.title.toLowerCase().includes(q) ||
        elem.description?.toLowerCase().includes(q) ||
        elem.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="w-full h-full p-8 pt-20 bg-slate-50 dark:bg-slate-950 overflow-y-auto select-none text-slate-800 dark:text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LucideIcons.ListFilter className="text-indigo-600" />
              <span>Structured Knowledge Directory</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured table list of all canvas entities, properties, and notes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter entities..."
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none w-52"
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              <option value="all">All Object Types</option>
              <option value="Microservice">Microservices</option>
              <option value="Database">Databases</option>
              <option value="Person">People</option>
              <option value="Project">Projects</option>
              <option value="Task">Tasks</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="p-3.5">Entity</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Tags</th>
                <th className="p-3.5">Key Properties</th>
                <th className="p-3.5 text-center">Notes</th>
                <th className="p-3.5 text-center">Comments</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No entities match the current criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((elem) => {
                  const IconComp =
                    (LucideIcons as Record<string, React.ElementType>)[elem.icon || 'Box'] ||
                    LucideIcons.Box;

                  return (
                    <tr
                      key={elem.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectElement(elem)}
                    >
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-lg shrink-0">
                          <IconComp size={16} />
                        </div>
                        <span className="truncate max-w-xs">{elem.title}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {elem.objectType || 'Generic'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {elem.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded text-[10px]"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-[11px]">
                        {elem.properties.slice(0, 2).map((p) => (
                          <div key={p.id} className="text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-slate-500">{p.key}:</span> {p.value}
                          </div>
                        ))}
                      </td>

                      <td className="p-3.5 text-center font-medium">
                        {elem.notes.length > 0 ? (
                          <span className="text-indigo-600 font-semibold">📝 {elem.notes.length}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center font-medium">
                        {elem.comments.length > 0 ? (
                          <span className="text-amber-600 font-semibold">💬 {elem.comments.length}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement(elem);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-xs font-semibold"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
