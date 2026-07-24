import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { ToolType, ElementType } from '../../types/canvas';

interface LeftToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onAddShape: (type: ElementType) => void;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  activeTool,
  onSelectTool,
  onAddShape,
}) => {
  const [showShapeMenu, setShowShapeMenu] = useState(false);

  const mainTools: { id: ToolType; label: string; icon: keyof typeof LucideIcons; shortcut: string }[] = [
    { id: 'select', label: 'Select & Move', icon: 'MousePointer', shortcut: 'V' },
    { id: 'pan', label: 'Hand / Pan Canvas', icon: 'Hand', shortcut: 'H' },
    { id: 'text', label: 'Add Text', icon: 'Type', shortcut: 'T' },
    { id: 'sticky-note', label: 'Sticky Note', icon: 'StickyNote', shortcut: 'N' },
    { id: 'connection', label: 'Draw Connection', icon: 'ArrowUpRight', shortcut: 'L' },
    { id: 'frame', label: 'Create Frame', icon: 'LayoutGrid', shortcut: 'F' },
    { id: 'freehand', label: 'Freehand Draw', icon: 'Pencil', shortcut: 'D' },
    { id: 'eraser', label: 'Eraser', icon: 'Eraser', shortcut: 'E' },
  ];

  const shapes: { type: ElementType; label: string; icon: keyof typeof LucideIcons }[] = [
    { type: 'rectangle', label: 'Rectangle', icon: 'Square' },
    { type: 'rounded-rectangle', label: 'Rounded Rect', icon: 'RectangleHorizontal' },
    { type: 'circle', label: 'Circle', icon: 'Circle' },
    { type: 'ellipse', label: 'Ellipse', icon: 'Disc' },
    { type: 'diamond', label: 'Diamond', icon: 'Diamond' },
  ];

  const renderIcon = (iconName: keyof typeof LucideIcons, size = 18) => {
    const IconComp = LucideIcons[iconName] as React.ElementType;
    if (!IconComp) return null;
    return <IconComp size={size} />;
  };

  return (
    <aside className="absolute left-0 top-0 bottom-0 w-14 bg-white border-r border-slate-200 flex flex-col items-center py-4 space-y-2 shrink-0 shadow-xs z-30 select-none">
      {mainTools.slice(0, 3).map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`relative p-2.5 rounded-xl flex items-center justify-center transition-colors group ${
              isActive
                ? 'bg-indigo-50 text-indigo-600 font-bold'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
            }`}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {renderIcon(tool.icon)}
            <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {tool.label} {tool.shortcut && <span className="text-slate-400 font-mono">[{tool.shortcut}]</span>}
            </span>
          </button>
        );
      })}

      {/* Shape Selector Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowShapeMenu(!showShapeMenu)}
          className={`relative p-2.5 rounded-xl flex items-center justify-center transition-colors group ${
            ['rectangle', 'rounded-rectangle', 'circle', 'ellipse', 'diamond'].includes(activeTool)
              ? 'bg-indigo-50 text-indigo-600 font-bold'
              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
          }`}
          title="Shapes (R)"
        >
          {renderIcon('Shapes')}
          <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Shapes & Nodes [R]
          </span>
        </button>

        {showShapeMenu && (
          <div className="absolute left-full top-0 ml-2 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-50 w-44 animate-in fade-in zoom-in-95">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Choose Shape</div>
            {shapes.map((s) => (
              <button
                key={s.type}
                onClick={() => {
                  onAddShape(s.type);
                  setShowShapeMenu(false);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors text-left font-medium"
              >
                {renderIcon(s.icon, 15)}
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {mainTools.slice(3).map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`relative p-2.5 rounded-xl flex items-center justify-center transition-colors group ${
              isActive
                ? 'bg-indigo-50 text-indigo-600 font-bold'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
            }`}
            title={`${tool.label} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
          >
            {renderIcon(tool.icon)}
            <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {tool.label} {tool.shortcut && <span className="text-slate-400 font-mono">[{tool.shortcut}]</span>}
            </span>
          </button>
        );
      })}
    </aside>
  );
};
