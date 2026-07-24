import React from 'react';
import { Plus } from 'lucide-react';
import { CanvasElement } from '../../types/canvas';

interface QuickAddHandlesProps {
  element: CanvasElement;
  viewport: { x: number; y: number; zoom: number };
  onQuickAddDirection: (direction: 'top' | 'right' | 'bottom' | 'left') => void;
}

export const QuickAddHandles: React.FC<QuickAddHandlesProps> = ({
  element,
  viewport,
  onQuickAddDirection,
}) => {
  const left = element.x * viewport.zoom + viewport.x;
  const top = element.y * viewport.zoom + viewport.y;
  const width = element.width * viewport.zoom;
  const height = element.height * viewport.zoom;

  const btnClasses =
    'absolute w-6 h-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-125 z-30 pointer-events-auto border border-white/60';

  return (
    <div className="pointer-events-none">
      {/* Top Plus */}
      <button
        className={`${btnClasses}`}
        style={{
          left: left + width / 2 - 12,
          top: top - 28,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onQuickAddDirection('top');
        }}
        title="Add connected node above"
      >
        <Plus size={14} />
      </button>

      {/* Right Plus */}
      <button
        className={`${btnClasses}`}
        style={{
          left: left + width + 10,
          top: top + height / 2 - 12,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onQuickAddDirection('right');
        }}
        title="Add connected node to right"
      >
        <Plus size={14} />
      </button>

      {/* Bottom Plus */}
      <button
        className={`${btnClasses}`}
        style={{
          left: left + width / 2 - 12,
          top: top + height + 10,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onQuickAddDirection('bottom');
        }}
        title="Add connected node below"
      >
        <Plus size={14} />
      </button>

      {/* Left Plus */}
      <button
        className={`${btnClasses}`}
        style={{
          left: left - 28,
          top: top + height / 2 - 12,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onQuickAddDirection('left');
        }}
        title="Add connected node to left"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};
