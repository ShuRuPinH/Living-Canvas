import React, { useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { StyleConfig } from '../../types/canvas';
import { COLOR_PALETTE, STICKY_COLORS } from '../../constants/templates';

interface StylePickerPopoverProps {
  styleConfig: StyleConfig;
  isStickyNote?: boolean;
  onUpdateStyle: (newStyle: Partial<StyleConfig>) => void;
  onBringToFront?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onSendToBack?: () => void;
  onClose: () => void;
}

const COMMON_ICONS = [
  'Server',
  'Database',
  'Shield',
  'Smartphone',
  'Zap',
  'Code',
  'Cpu',
  'Cloud',
  'Globe',
  'User',
  'Users',
  'FileText',
  'Folder',
  'Box',
  'HardDrive',
  'Lock',
  'Key',
  'Terminal',
  'Activity',
  'CheckCircle',
  'Sparkles',
  'Settings',
];

export const StylePickerPopover: React.FC<StylePickerPopoverProps> = ({
  styleConfig,
  isStickyNote,
  onUpdateStyle,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onClose,
}) => {
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
  return (
    <div
      className="fixed z-[100] top-20 right-4 sm:right-[400px] w-80 max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-4 animate-in fade-in zoom-in-95 select-none text-slate-800 dark:text-slate-100 pointer-events-auto"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <LucideIcons.Palette size={16} className="text-amber-500" />
          <span>Visual Styling & Theme</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
        >
          <LucideIcons.X size={16} />
        </button>
      </div>

      {/* Sticky Note Color Presets */}
      {isStickyNote ? (
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
            Sticky Color
          </label>
          <div className="grid grid-cols-6 gap-2">
            {STICKY_COLORS.map((sc) => (
              <button
                key={sc.name}
                onClick={() =>
                  onUpdateStyle({ stickyColor: sc.bg, textColor: sc.text })
                }
                className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 hover:scale-110 transition-transform shadow-xs"
                style={{ backgroundColor: sc.bg }}
                title={sc.name}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Color Palette Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Color Palette Presets
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PALETTE.map((cp) => (
                <button
                  key={cp.name}
                  onClick={() =>
                    onUpdateStyle({
                      fillColor: cp.fill,
                      strokeColor: cp.stroke,
                      textColor: cp.text,
                    })
                  }
                  className="px-2 py-1.5 rounded-lg border border-slate-300 text-[11px] font-medium flex items-center gap-1.5 hover:scale-105 transition-transform"
                  style={{ backgroundColor: cp.fill, borderColor: cp.stroke, color: cp.text }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cp.stroke }}
                  />
                  <span>{cp.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Hex Color Inputs */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Fill</label>
              <input
                type="color"
                value={styleConfig.fillColor || '#ffffff'}
                onChange={(e) => onUpdateStyle({ fillColor: e.target.value })}
                className="w-full h-8 rounded cursor-pointer border border-slate-300"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Stroke</label>
              <input
                type="color"
                value={styleConfig.strokeColor || '#64748b'}
                onChange={(e) => onUpdateStyle({ strokeColor: e.target.value })}
                className="w-full h-8 rounded cursor-pointer border border-slate-300"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Text</label>
              <input
                type="color"
                value={styleConfig.textColor || '#0f172a'}
                onChange={(e) => onUpdateStyle({ textColor: e.target.value })}
                className="w-full h-8 rounded cursor-pointer border border-slate-300"
              />
            </div>
          </div>

          {/* Border Width & Style */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Stroke Width
              </label>
              <div className="flex gap-1">
                {[1, 2, 4, 6].map((w) => (
                  <button
                    key={w}
                    onClick={() => onUpdateStyle({ strokeWidth: w })}
                    className={`flex-1 py-1 rounded text-xs border ${
                      (styleConfig.strokeWidth ?? 2) === w
                        ? 'bg-indigo-600 text-white font-bold border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Border Style
              </label>
              <div className="flex gap-1">
                {(['solid', 'dashed', 'dotted'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdateStyle({ strokeStyle: s })}
                    className={`flex-1 py-1 rounded text-xs capitalize border ${
                      (styleConfig.strokeStyle || 'solid') === s
                        ? 'bg-indigo-600 text-white font-bold border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {s[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Font Size & Weight */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">
            Font Size
          </label>
          <div className="flex gap-1">
            {[12, 14, 16, 20].map((sz) => (
              <button
                key={sz}
                onClick={() => onUpdateStyle({ fontSize: sz })}
                className={`flex-1 py-1 rounded text-xs ${
                  (styleConfig.fontSize ?? 14) === sz
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">
            Font Weight
          </label>
          <div className="flex gap-1">
            {(['normal', 'medium', 'bold'] as const).map((fw) => (
              <button
                key={fw}
                onClick={() => onUpdateStyle({ fontWeight: fw })}
                className={`flex-1 py-1 rounded text-xs capitalize ${
                  (styleConfig.fontWeight || 'normal') === fw
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {fw[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Icon Picker */}
      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-2">
          Select Icon Badge
        </label>
        <div className="grid grid-cols-8 gap-1 max-h-28 overflow-y-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onUpdateStyle({ icon: undefined })}
            className={`p-1.5 rounded flex items-center justify-center text-xs ${
              !styleConfig.icon ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-700'
            }`}
            title="None"
          >
            🚫
          </button>
          {COMMON_ICONS.map((iconName) => {
            const IconComp = (LucideIcons as Record<string, React.ElementType>)[iconName];
            if (!IconComp) return null;
            const isSelected = styleConfig.icon === iconName;
            return (
              <button
                key={iconName}
                onClick={() => onUpdateStyle({ icon: iconName })}
                className={`p-1.5 rounded flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={iconName}
              >
                <IconComp size={16} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Layer Order (Z-Index) Controls */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <label className="text-xs font-semibold text-slate-500 block mb-2">
          Layer Order / Z-Position
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => onBringToFront?.()}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Bring to Front (Shift + ])"
          >
            <LucideIcons.BringToFront size={16} />
            <span className="mt-1">To Front</span>
          </button>

          <button
            onClick={() => onBringForward?.()}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Bring Forward (])"
          >
            <LucideIcons.ArrowUp size={16} />
            <span className="mt-1">Forward</span>
          </button>

          <button
            onClick={() => onSendBackward?.()}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Send Backward ([)"
          >
            <LucideIcons.ArrowDown size={16} />
            <span className="mt-1">Backward</span>
          </button>

          <button
            onClick={() => onSendToBack?.()}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Send to Back (Shift + [)"
          >
            <LucideIcons.SendToBack size={16} />
            <span className="mt-1">To Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};
