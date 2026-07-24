import React from 'react';
import * as LucideIcons from 'lucide-react';
import { CanvasElement, KnowledgeObjectType } from '../../types/canvas';

interface BoardViewProps {
  elements: Record<string, CanvasElement>;
  onSelectElement: (elem: CanvasElement) => void;
}

const BOARD_COLUMNS: { type: KnowledgeObjectType; label: string; color: string }[] = [
  { type: 'Microservice', label: 'Microservices', color: 'border-indigo-500' },
  { type: 'Database', label: 'Databases & Storage', color: 'border-emerald-500' },
  { type: 'Project', label: 'Projects & Frames', color: 'border-purple-500' },
  { type: 'Task', label: 'Tasks & RFCs', color: 'border-amber-500' },
  { type: 'Generic', label: 'General Knowledge', color: 'border-slate-500' },
];

export const BoardView: React.FC<BoardViewProps> = ({ elements, onSelectElement }) => {
  const elemList = Object.values(elements) as CanvasElement[];

  return (
    <div className="w-full h-full p-8 pt-20 bg-slate-50 dark:bg-slate-950 overflow-x-auto select-none text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LucideIcons.Kanban className="text-indigo-600" />
            <span>Kanban Matrix Board</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organized knowledge cards categorized by entity object type.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {BOARD_COLUMNS.map((col) => {
            const colItems = elemList.filter(
              (e) => (e.objectType || 'Generic') === col.type
            );

            return (
              <div
                key={col.type}
                className={`bg-white dark:bg-slate-900 rounded-2xl border-t-4 ${col.color} border-x border-b border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-col gap-3 min-h-[400px]`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    {col.label}
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs font-mono font-semibold">
                    {colItems.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colItems.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs italic border border-dashed rounded-xl">
                      No entities
                    </div>
                  ) : (
                    colItems.map((elem) => {
                      const IconComp =
                        (LucideIcons as Record<string, React.ElementType>)[
                          elem.icon || 'Box'
                        ] || LucideIcons.Box;

                      return (
                        <div
                          key={elem.id}
                          onClick={() => onSelectElement(elem)}
                          className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer shadow-2xs group space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded">
                              <IconComp size={14} />
                            </div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {elem.title}
                            </span>
                          </div>

                          {elem.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                              {elem.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                            <span>📝 {elem.notes.length} notes</span>
                            <span>💬 {elem.comments.length}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
