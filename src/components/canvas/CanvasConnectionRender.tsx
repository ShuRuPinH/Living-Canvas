import React from 'react';
import { CanvasConnection, CanvasElement } from '../../types/canvas';
import { getAnchorPoint, generateConnectionPath } from '../../utils/canvas';

interface CanvasConnectionRenderProps {
  connection: CanvasConnection;
  sourceElem?: CanvasElement;
  targetElem?: CanvasElement;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent, connection: CanvasConnection) => void;
}

export const CanvasConnectionRender: React.FC<CanvasConnectionRenderProps> = ({
  connection,
  sourceElem,
  targetElem,
  isSelected,
  onSelect,
}) => {
  if (!sourceElem || !targetElem) return null;

  const startPoint = getAnchorPoint(
    sourceElem,
    connection.sourceAnchor || 'auto',
    targetElem
  );
  const endPoint = getAnchorPoint(
    targetElem,
    connection.targetAnchor || 'auto',
    sourceElem
  );

  const lineCurve = connection.style.lineCurve || 'curved';
  const pathData = generateConnectionPath(startPoint, endPoint, lineCurve);

  const midX = (startPoint.x + endPoint.x) / 2;
  const midY = (startPoint.y + endPoint.y) / 2;

  const strokeColor = isSelected
    ? '#6366f1'
    : connection.style.strokeColor || '#64748b';
  const strokeWidth = connection.style.strokeWidth || 2;
  const strokeStyle = connection.style.strokeStyle || 'solid';

  const strokeDasharray =
    strokeStyle === 'dashed' ? '6 4' : strokeStyle === 'dotted' ? '2 4' : 'none';

  const markerId = `arrow-${connection.id}`;

  return (
    <g className="group cursor-pointer pointer-events-auto" onClick={(e) => onSelect(e, connection)}>
      <defs>
        {/* Direction Arrow Marker */}
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Invisible wider path for easy click selection */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(strokeWidth + 12, 16)}
        className="cursor-pointer"
      />

      {/* Selected Glow / Highlight */}
      {isSelected && (
        <path
          d={pathData}
          fill="none"
          stroke="#818cf8"
          strokeWidth={strokeWidth + 6}
          strokeOpacity={0.4}
          strokeLinecap="round"
        />
      )}

      {/* Main Visible Line */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        markerEnd={`url(#${markerId})`}
        markerStart={connection.isBiDirectional ? `url(#${markerId})` : undefined}
        className="transition-colors"
      />

      {/* Connection Label & Type Pill */}
      {Boolean(
        (connection.label && connection.label.trim() !== '') ||
        (connection.connectionType && connection.connectionType.trim() !== '')
      ) && (
        <foreignObject
          x={midX - 90}
          y={midY - 16}
          width={180}
          height={36}
          className="overflow-visible pointer-events-none"
        >
          <div className="flex justify-center items-center h-full">
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs border flex items-center gap-1.5 backdrop-blur-xs transition-transform ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 scale-105'
                  : 'bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600'
              }`}
            >
              {connection.connectionType && connection.connectionType.trim() !== '' && (
                <span className="opacity-75 font-mono text-[10px] uppercase tracking-wide">
                  [{connection.connectionType}]
                </span>
              )}
              {connection.label && connection.label.trim() !== '' && (
                <span className="truncate max-w-[100px]">{connection.label}</span>
              )}
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
};
