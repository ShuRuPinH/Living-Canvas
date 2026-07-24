import React from 'react';
import * as LucideIcons from 'lucide-react';
import { CanvasElement, CanvasConnection } from '../../types/canvas';

interface QuickActionToolbarProps {
  selectedElement?: CanvasElement;
  selectedConnection?: CanvasConnection;
  viewport: { x: number; y: number; zoom: number };
  onAddChild: () => void;
  onConnectMode: () => void;
  onAddNote: () => void;
  onAddComment: () => void;
  onAddProperty: () => void;
  onOpenStylePicker: () => void;
  onBringToFront?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onSendToBack?: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenDetails: () => void;
}

export const QuickActionToolbar: React.FC<QuickActionToolbarProps> = ({
  selectedElement,
  selectedConnection,
  viewport,
  onAddChild,
  onConnectMode,
  onAddNote,
  onAddComment,
  onAddProperty,
  onOpenStylePicker,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onDuplicate,
  onDelete,
  onOpenDetails,
}) => {
  if (!selectedElement && !selectedConnection) return null;

  let posX = 0;
  let posY = 0;

  if (selectedElement) {
    posX = selectedElement.x * viewport.zoom + viewport.x + (selectedElement.width * viewport.zoom) / 2;
    posY = selectedElement.y * viewport.zoom + viewport.y - 32;
  } else if (selectedConnection) {
    posX = window.innerWidth / 2;
    posY = 100;
  }

  return (
    <div
      className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 bg-slate-900/95 text-white backdrop-blur-md px-2 py-1.5 rounded-xl shadow-2xl border border-slate-700/90 flex items-center gap-1 select-none animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
      style={{
        left: Math.max(160, Math.min(window.innerWidth - 160, posX)),
        top: Math.max(80, posY),
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {selectedElement && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            title="Add Child Node (Tab)"
          >
            <LucideIcons.GitFork size={14} />
            <span>+ Child</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onConnectMode();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
            title="Draw Connection (L)"
          >
            <LucideIcons.ArrowUpRight size={14} />
            <span>Connect</span>
          </button>

          <div className="w-px h-4 bg-slate-700 mx-0.5" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddNote();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Add Note (📝)"
          >
            <LucideIcons.FileText size={15} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddComment();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Add Comment (💬)"
          >
            <LucideIcons.MessageSquare size={15} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddProperty();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Add Key-Value Property (➕)"
          >
            <LucideIcons.PlusCircle size={15} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenStylePicker();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            title="Change Style / Colors (🎨)"
          >
            <LucideIcons.Palette size={15} />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-0.5" />

          {/* Layer Ordering Controls */}
          {onBringToFront && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBringToFront();
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              title="Bring to Front (Shift + ])"
            >
              <LucideIcons.BringToFront size={15} />
            </button>
          )}

          {onSendToBack && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSendToBack();
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              title="Send to Back (Shift + [)"
            >
              <LucideIcons.SendToBack size={15} />
            </button>
          )}

          <div className="w-px h-4 bg-slate-700 mx-0.5" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            className="p-1.5 rounded-lg hover:bg-indigo-600/80 active:bg-indigo-600 text-indigo-300 hover:text-white transition-colors font-medium text-xs flex items-center gap-1 cursor-pointer"
            title="Open Details Panel"
          >
            <LucideIcons.PanelRight size={15} />
            <span>Details</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Duplicate (Cmd+D)"
          >
            <LucideIcons.Copy size={15} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg hover:bg-rose-950 active:bg-rose-900 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            title="Delete (Backspace)"
          >
            <LucideIcons.Trash2 size={15} />
          </button>
        </>
      )}

      {selectedConnection && (
        <>
          <span className="text-xs font-semibold px-2 text-indigo-300">Connection Selected</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            Edit Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg hover:bg-rose-950 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            title="Delete Connection"
          >
            <LucideIcons.Trash2 size={15} />
          </button>
        </>
      )}
    </div>
  );
};
