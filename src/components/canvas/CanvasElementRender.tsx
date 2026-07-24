import React from 'react';
import * as LucideIcons from 'lucide-react';
import { CanvasElement, DisplayMode } from '../../types/canvas';
import { getFreehandPathData } from '../../utils/canvas';

interface CanvasElementRenderProps {
  element: CanvasElement;
  isSelected: boolean;
  globalDisplayMode: DisplayMode;
  connectionsCount: number;
  onSelect: (e: React.MouseEvent, element: CanvasElement) => void;
  onDoubleClick: (element: CanvasElement) => void;
  onMouseDownResize: (e: React.MouseEvent, handle: string) => void;
  onMouseDownRotate: (e: React.MouseEvent) => void;
  onMouseDownMove?: (e: React.MouseEvent, element: CanvasElement) => void;
}

export const CanvasElementRender: React.FC<CanvasElementRenderProps> = ({
  element,
  isSelected,
  globalDisplayMode,
  connectionsCount,
  onSelect,
  onDoubleClick,
  onMouseDownResize,
  onMouseDownRotate,
  onMouseDownMove,
}) => {
  const displayMode = element.displayMode || globalDisplayMode;

  // Icon dynamic rendering
  const renderIcon = (iconName?: string, size = 18, className = '') => {
    if (!iconName) return null;
    const IconComp = (LucideIcons as Record<string, React.ElementType>)[iconName];
    if (!IconComp) return null;
    return <IconComp size={size} className={className} />;
  };

  const style = element.style || {};
  const fillColor = style.fillColor || '#ffffff';
  const strokeColor = style.strokeColor || '#64748b';
  const strokeWidth = style.strokeWidth ?? 2;
  const strokeStyle = style.strokeStyle || 'solid';
  const textColor = style.textColor || '#0f172a';
  const fontSize = style.fontSize || 14;
  const fontWeight = style.fontWeight || 'normal';
  const cornerRadius = style.cornerRadius ?? 8;
  const opacity = style.opacity ?? 1;

  const notesCount = element.notes?.length || 0;
  const commentsCount = element.comments?.length || 0;
  const attachmentsCount = element.attachments?.length || 0;

  const hasBadges = notesCount > 0 || connectionsCount > 0 || commentsCount > 0 || attachmentsCount > 0;

  const borderDashArray =
    strokeStyle === 'dashed' ? '6 4' : strokeStyle === 'dotted' ? '2 4' : 'none';

  // Render content based on shape type
  const renderShapeContent = () => {
    if (element.type === 'frame') {
      return (
        <div
          className={`w-full h-full relative border-2 border-dashed border-slate-300 rounded-2xl bg-slate-400/5 transition-all ${
            isSelected ? 'border-indigo-500 ring-4 ring-indigo-500/10' : ''
          }`}
          style={{
            borderColor: isSelected ? '#6366f1' : strokeColor,
            backgroundColor: fillColor,
            opacity,
          }}
        >
          {/* Frame Title Badge Header */}
          <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-[#F3F4F6] text-[10px] font-bold text-slate-500 uppercase tracking-widest rounded flex items-center gap-1.5 border border-slate-200 shadow-2xs">
            <LucideIcons.LayoutGrid size={12} className="text-indigo-600" />
            <span>{element.title || 'VPC - CLUSTER'}</span>
            {element.tags.length > 0 && (
              <span className="text-slate-400 font-mono">#{element.tags[0]}</span>
            )}
          </div>
        </div>
      );
    }

    if (element.type === 'sticky-note') {
      const bg = style.stickyColor || '#fef08a';
      return (
        <div
          className="w-full h-full p-4 pb-3 rounded-lg shadow-md flex flex-col justify-between select-none relative transition-all"
          style={{
            backgroundColor: bg,
            color: textColor || '#713f12',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Folded corner effect */}
          <div className="absolute top-0 right-0 w-5 h-5 bg-black/10 rounded-bl-lg pointer-events-none" />

          <div>
            <div className="font-semibold text-sm mb-1 flex items-center gap-1.5">
              {renderIcon(element.icon, 16)}
              <span>{element.title}</span>
            </div>
            {element.description && (
              <p className="text-xs line-clamp-4 opacity-90 leading-relaxed font-sans">
                {element.description}
              </p>
            )}
          </div>

          {hasBadges && displayMode !== 'minimal' && (
            <div className="flex items-center gap-2.5 text-[11px] opacity-80 pt-1.5 pb-0.5 border-t border-black/10 shrink-0">
              {notesCount > 0 && (
                <span className="flex items-center gap-1" title={`${notesCount} notes`}>
                  <LucideIcons.FileText size={12} />
                  <span>{notesCount}</span>
                </span>
              )}
              {connectionsCount > 0 && (
                <span className="flex items-center gap-1" title={`${connectionsCount} connections`}>
                  <LucideIcons.Link2 size={12} />
                  <span>{connectionsCount}</span>
                </span>
              )}
              {commentsCount > 0 && (
                <span className="flex items-center gap-1" title={`${commentsCount} comments`}>
                  <LucideIcons.MessageSquare size={12} />
                  <span>{commentsCount}</span>
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    if (element.type === 'text') {
      return (
        <div
          className="w-full h-full flex items-center px-2 py-1 leading-snug break-words"
          style={{
            color: textColor,
            fontSize,
            fontWeight,
            opacity,
          }}
        >
          {element.title || 'Type text...'}
        </div>
      );
    }

    if (element.type === 'image') {
      return (
        <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100 flex flex-col">
          {element.imageUrl ? (
            <img
              src={element.imageUrl}
              alt={element.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-400">
              <LucideIcons.Image size={32} />
              <span className="text-xs mt-2">{element.title || 'Image'}</span>
            </div>
          )}
        </div>
      );
    }

    if (element.type === 'freehand') {
      const pathData = getFreehandPathData(element.freehandPoints || []);
      return (
        <svg className="w-full h-full overflow-visible pointer-events-none">
          <path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        </svg>
      );
    }

    // Standard Shapes: rectangle, rounded-rectangle, circle, ellipse, diamond
    let shapeSvgPath = '';
    const w = element.width;
    const h = element.height;

    if (element.type === 'rectangle' || element.type === 'rounded-rectangle') {
      const rx = element.type === 'rounded-rectangle' ? cornerRadius : 0;
      shapeSvgPath = `M ${rx} 0 L ${w - rx} 0 A ${rx} ${rx} 0 0 1 ${w} ${rx} L ${w} ${
        h - rx
      } A ${rx} ${rx} 0 0 1 ${w - rx} ${h} L ${rx} ${h} A ${rx} ${rx} 0 0 1 0 ${
        h - rx
      } L 0 ${rx} A ${rx} ${rx} 0 0 1 ${rx} 0 Z`;
    } else if (element.type === 'circle' || element.type === 'ellipse') {
      shapeSvgPath = `M ${w / 2} 0 A ${w / 2} ${h / 2} 0 1 1 ${w / 2} ${h} A ${
        w / 2
      } ${h / 2} 0 1 1 ${w / 2} 0 Z`;
    } else if (element.type === 'diamond') {
      shapeSvgPath = `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`;
    }

    return (
      <div className="w-full h-full relative group">
        <svg className="w-full h-full overflow-visible absolute inset-0">
          <path
            d={shapeSvgPath}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={borderDashArray}
            opacity={opacity}
            className="transition-colors"
          />
        </svg>

        {/* Content Container inside Shape */}
        <div className="absolute inset-0 px-4 pt-3 pb-3 flex flex-col justify-between pointer-events-none z-10 overflow-hidden">
          {/* Top category badge or icon */}
          <div className="flex justify-between items-center w-full shrink-0 gap-1.5">
            <span className="text-[10px] font-bold text-indigo-700 uppercase bg-indigo-50/90 px-2 py-0.5 rounded-md border border-indigo-200/80 shadow-2xs tracking-wide truncate max-w-[80%]">
              {element.objectType || (element.type === 'rounded-rectangle' ? 'Microservice' : element.type)}
            </span>
            {element.icon && (
              <div
                className="p-1 rounded-md bg-indigo-100/90 text-indigo-700 border border-indigo-200/90 shadow-2xs flex items-center justify-center shrink-0"
                title={`Icon: ${element.icon}`}
              >
                {renderIcon(element.icon, 15)}
              </div>
            )}
          </div>

          {/* Title & Description */}
          <div className="flex flex-col my-auto text-left w-full min-h-0 py-1">
            <h3
              className="font-bold text-slate-800 leading-tight truncate"
              style={{ fontSize: Math.max(fontSize, 13), color: textColor }}
            >
              {element.title}
            </h3>

            {displayMode !== 'minimal' && element.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-snug">
                {element.description}
              </p>
            )}

            {/* Display Mode: Detailed Properties List */}
            {displayMode === 'detailed' && element.properties.length > 0 && (
              <div className="mt-1.5 text-[10px] w-full bg-slate-50 p-1.5 rounded border border-slate-200/70 flex flex-col gap-0.5">
                {element.properties.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex justify-between items-center gap-2">
                    <span className="font-semibold text-slate-500 truncate">{p.key}:</span>
                    <span className="truncate text-slate-800 font-mono">{p.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Indicators Badges Footer */}
          {displayMode !== 'minimal' && hasBadges && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 border-t border-slate-200/80 pt-1.5 pb-0 shrink-0 mt-auto">
              {notesCount > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 shadow-2xs" title={`${notesCount} notes`}>
                  <LucideIcons.FileText size={11} className="text-amber-600" />
                  <span className="text-[10px] font-bold">{notesCount}</span>
                </span>
              )}
              {connectionsCount > 0 && (
                <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/80 shadow-2xs" title={`${connectionsCount} connections`}>
                  <LucideIcons.Link2 size={11} className="text-indigo-600" />
                  <span className="text-[10px] font-bold">{connectionsCount}</span>
                </span>
              )}
              {commentsCount > 0 && (
                <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/80 shadow-2xs" title={`${commentsCount} comments`}>
                  <LucideIcons.MessageSquare size={11} className="text-sky-600" />
                  <span className="text-[10px] font-bold">{commentsCount}</span>
                </span>
              )}
              {attachmentsCount > 0 && (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 shadow-2xs" title={`${attachmentsCount} files`}>
                  <LucideIcons.Paperclip size={11} className="text-emerald-600" />
                  <span className="text-[10px] font-bold">{attachmentsCount}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      id={`element-${element.id}`}
      className="absolute select-none cursor-pointer group pointer-events-auto"
      style={{
        transform: `translate(${element.x}px, ${element.y}px) rotate(${
          element.rotation || 0
        }deg)`,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
      }}
      onClick={(e) => onSelect(e, element)}
      onDoubleClick={() => onDoubleClick(element)}
    >
      {/* Main Shape Content */}
      {renderShapeContent()}

      {/* Selected Box Outline & Control Handles */}
      {isSelected && (
        <div className="absolute -inset-1.5 border-2 border-indigo-500 pointer-events-none rounded-lg shadow-sm">
          {/* Drag Handle Badge */}
          <div
            className="absolute -top-7 left-0 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-md shadow-md cursor-grab active:cursor-grabbing pointer-events-auto flex items-center gap-1.5 transition-colors select-none"
            onMouseDown={(e) => {
              e.stopPropagation();
              if (onMouseDownMove) {
                onMouseDownMove(e, element);
              } else {
                onSelect(e, element);
              }
            }}
            title="Grab and drag to move block"
          >
            <LucideIcons.GripHorizontal size={12} />
            <span>Move</span>
          </div>

          {/* Rotation Handle */}
          <div
            className="absolute -top-7 right-0 w-5 h-5 bg-white border-2 border-indigo-600 rounded-full cursor-grab pointer-events-auto shadow-md hover:scale-110 transition-transform flex items-center justify-center pointer-events-auto"
            onMouseDown={(e) => {
              e.stopPropagation();
              onMouseDownRotate(e);
            }}
            title="Rotate element"
          >
            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
          </div>

          {/* 8 Resize Handles */}
          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => {
            let positionClasses = '';
            let cursor = '';

            switch (handle) {
              case 'nw':
                positionClasses = '-top-1.5 -left-1.5';
                cursor = 'cursor-nwse-resize';
                break;
              case 'n':
                positionClasses = '-top-1.5 left-1/2 -translate-x-1/2';
                cursor = 'cursor-ns-resize';
                break;
              case 'ne':
                positionClasses = '-top-1.5 -right-1.5';
                cursor = 'cursor-nesw-resize';
                break;
              case 'e':
                positionClasses = 'top-1/2 -right-1.5 -translate-y-1/2';
                cursor = 'cursor-ew-resize';
                break;
              case 'se':
                positionClasses = '-bottom-1.5 -right-1.5';
                cursor = 'cursor-nwse-resize';
                break;
              case 's':
                positionClasses = '-bottom-1.5 left-1/2 -translate-x-1/2';
                cursor = 'cursor-ns-resize';
                break;
              case 'sw':
                positionClasses = '-bottom-1.5 -left-1.5';
                cursor = 'cursor-nesw-resize';
                break;
              case 'w':
                positionClasses = 'top-1/2 -left-1.5 -translate-y-1/2';
                cursor = 'cursor-ew-resize';
                break;
            }

            return (
              <div
                key={handle}
                className={`absolute w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs pointer-events-auto ${positionClasses} ${cursor} hover:scale-125 transition-transform shadow-xs`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onMouseDownResize(e, handle);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
