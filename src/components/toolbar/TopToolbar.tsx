import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { ViewMode, DisplayMode } from '../../types/canvas';

interface TopToolbarProps {
  boardName: string;
  onUpdateBoardName: (name: string) => void;
  activeView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  globalDisplayMode: DisplayMode;
  onChangeDisplayMode: (mode: DisplayMode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitScreen: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  showGrid: boolean;
  snapToGrid: boolean;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onOpenSearch: () => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  onExportPNG: () => void;
  onResetDemo: () => void;
  onOpenShortcuts: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  boardName,
  onUpdateBoardName,
  activeView,
  onChangeView,
  globalDisplayMode,
  onChangeDisplayMode,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitScreen,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showGrid,
  snapToGrid,
  onToggleGrid,
  onToggleSnap,
  onOpenSearch,
  onExportJSON,
  onImportJSON,
  onExportPNG,
  onResetDemo,
  onOpenShortcuts,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(boardName);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const views: { id: ViewMode; label: string; icon: keyof typeof LucideIcons }[] = [
    { id: 'canvas', label: 'Canvas', icon: 'Layout' },
    { id: 'list', label: 'List', icon: 'ListFilter' },
    { id: 'graph', label: 'Graph', icon: 'Network' },
    { id: 'board', label: 'Board', icon: 'Kanban' },
  ];

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (nameInput.trim()) {
      onUpdateBoardName(nameInput.trim());
    } else {
      setNameInput(boardName);
    }
  };

  return (
    <header className="h-14 w-full bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shrink-0 shadow-xs select-none relative">
      {/* Left Branding & Board Name */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold shadow-xs">
            <div className="w-4 h-4 bg-white rounded-full opacity-90 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800 leading-tight">Living Canvas</span>
            {isEditingName ? (
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                autoFocus
                className="px-1.5 py-0.5 text-xs font-medium text-slate-800 bg-slate-50 border border-indigo-500 rounded outline-none w-44"
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="group flex items-center gap-1 text-xs text-slate-400 font-medium hover:text-slate-700 transition-colors"
                title="Click to rename board"
              >
                <span className="max-w-[180px] truncate">{boardName}</span>
                <LucideIcons.Pencil size={10} className="opacity-0 group-hover:opacity-70 transition-opacity" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Middle Views Switcher & Display Mode */}
      <div className="flex items-center gap-3">
        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200/80">
          {views.map((v) => {
            const IconComp = LucideIcons[v.icon] as React.ElementType;
            const isActive = activeView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onChangeView(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                }`}
              >
                {IconComp && <IconComp size={13} />}
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>

        {/* Display Mode Dropdown (Minimal / Compact / Detailed) */}
        {activeView === 'canvas' && (
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200/80">
            <span className="text-slate-400 px-1.5 text-[10px] font-bold uppercase tracking-wider">Mode:</span>
            {(['minimal', 'compact', 'detailed'] as DisplayMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onChangeDisplayMode(mode)}
                className={`px-2 py-0.5 rounded capitalize text-xs transition-all ${
                  globalDisplayMode === mode
                    ? 'bg-white text-slate-800 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Actions: Search, Undo/Redo, Grid, Zoom, Export */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
          title="Search Knowledge Board (Cmd+F)"
        >
          <LucideIcons.Search size={16} />
          <kbd className="hidden md:inline-block text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-mono font-medium">
            ⌘F
          </kbd>
        </button>

        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/80">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-slate-600 disabled:opacity-30 hover:bg-white rounded transition-colors"
            title="Undo (Cmd+Z)"
          >
            <LucideIcons.Undo2 size={14} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-slate-600 disabled:opacity-30 hover:bg-white rounded transition-colors"
            title="Redo (Cmd+Shift+Z)"
          >
            <LucideIcons.Redo2 size={14} />
          </button>
        </div>

        {/* Grid & Snap Toggles */}
        {activeView === 'canvas' && (
          <div className="hidden xl:flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              onClick={onToggleGrid}
              className={`p-1.5 rounded text-xs font-medium transition-colors ${
                showGrid
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Toggle Grid Lines"
            >
              <LucideIcons.Grid3X3 size={14} />
            </button>
            <button
              onClick={onToggleSnap}
              className={`p-1.5 rounded text-xs font-medium transition-colors ${
                snapToGrid
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Toggle Snap to Grid"
            >
              <LucideIcons.Magnet size={14} />
            </button>
          </div>
        )}

        {/* Zoom Controls */}
        {activeView === 'canvas' && (
          <div className="hidden md:flex items-center gap-1 bg-slate-100 px-1.5 py-1 rounded-lg border border-slate-200/80 text-xs">
            <button
              onClick={onZoomOut}
              className="p-0.5 text-slate-600 hover:bg-white rounded"
              title="Zoom Out"
            >
              <LucideIcons.Minus size={12} />
            </button>
            <button
              onClick={onResetZoom}
              className="px-1 py-0.5 font-mono font-bold text-slate-700 hover:bg-white rounded"
              title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={onZoomIn}
              className="p-0.5 text-slate-600 hover:bg-white rounded"
              title="Zoom In"
            >
              <LucideIcons.Plus size={12} />
            </button>
            <button
              onClick={onFitScreen}
              className="p-0.5 text-slate-600 hover:bg-white rounded ml-0.5"
              title="Fit to Screen"
            >
              <LucideIcons.Maximize2 size={12} />
            </button>
          </div>
        )}

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Primary Action Button */}
        <button
          onClick={onExportJSON}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          Export JSON
        </button>

        {/* More Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 flex items-center justify-center"
            title="More Options"
          >
            <LucideIcons.MoreVertical size={16} />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 flex flex-col gap-1 text-xs text-slate-700 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  onExportJSON();
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg transition-colors text-left font-medium"
              >
                <LucideIcons.Download size={14} className="text-indigo-600" />
                <span>Export Board as JSON</span>
              </button>

              <button
                onClick={() => {
                  onImportJSON();
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg transition-colors text-left font-medium"
              >
                <LucideIcons.Upload size={14} className="text-emerald-600" />
                <span>Import JSON Board</span>
              </button>

              <button
                onClick={() => {
                  onExportPNG();
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg transition-colors text-left font-medium"
              >
                <LucideIcons.FileImage size={14} className="text-sky-600" />
                <span>Export Canvas Image</span>
              </button>

              <div className="h-px bg-slate-100 my-0.5" />

              <button
                onClick={() => {
                  onOpenShortcuts();
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg transition-colors text-left font-medium"
              >
                <LucideIcons.Keyboard size={14} className="text-amber-500" />
                <span>Keyboard Shortcuts (?)</span>
              </button>

              <button
                onClick={() => {
                  onResetDemo();
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors text-left font-medium"
              >
                <LucideIcons.RotateCcw size={14} />
                <span>Reset Demo Architecture</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
