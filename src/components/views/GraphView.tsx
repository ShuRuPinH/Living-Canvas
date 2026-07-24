import React from 'react';
import * as LucideIcons from 'lucide-react';
import { CanvasElement, CanvasConnection } from '../../types/canvas';
import { getAnchorPoint, generateConnectionPath } from '../../utils/canvas';

interface GraphViewProps {
  elements: Record<string, CanvasElement>;
  connections: Record<string, CanvasConnection>;
  onSelectElement: (elem: CanvasElement) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({
  elements,
  connections,
  onSelectElement,
}) => {
  const elemList = Object.values(elements) as CanvasElement[];
  const connList = Object.values(connections) as CanvasConnection[];

  return (
    <div className="w-full h-full p-8 pt-20 bg-slate-900 text-white overflow-hidden flex flex-col relative select-none">
      <div className="absolute top-20 left-8 z-10 bg-slate-800/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-xl">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <LucideIcons.Network className="text-indigo-400" size={18} />
          <span>Interactive Knowledge Network Graph</span>
        </h2>
        <p className="text-xs text-slate-400">
          Visual relationship map connecting nodes, microservices, and databases.
        </p>
      </div>

      <svg className="w-full h-full overflow-visible">
        {/* Connection Lines */}
        {connList.map((conn) => {
          const source = elements[conn.sourceId];
          const target = elements[conn.targetId];
          if (!source || !target) return null;

          const start = getAnchorPoint(source, 'auto', target);
          const end = getAnchorPoint(target, 'auto', source);
          const pathData = generateConnectionPath(start, end, 'curved');

          return (
            <g key={conn.id}>
              <path
                d={pathData}
                fill="none"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="4 4"
                opacity={0.6}
              />
              {conn.label && (
                <text
                  x={(start.x + end.x) / 2}
                  y={(start.y + end.y) / 2 - 8}
                  fill="#a5b4fc"
                  fontSize={10}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {conn.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {elemList.map((elem) => {
          const IconComp =
            (LucideIcons as Record<string, React.ElementType>)[elem.icon || 'Box'] ||
            LucideIcons.Box;

          return (
            <g
              key={elem.id}
              transform={`translate(${elem.x + elem.width / 2}, ${elem.y + elem.height / 2})`}
              onClick={() => onSelectElement(elem)}
              className="cursor-pointer group"
            >
              {/* Node Circle */}
              <circle
                r={36}
                fill="#1e293b"
                stroke="#6366f1"
                strokeWidth={3}
                className="group-hover:scale-110 transition-transform shadow-xl"
              />

              {/* Title label */}
              <text
                y={52}
                fill="#f8fafc"
                fontSize={12}
                fontWeight="bold"
                textAnchor="middle"
              >
                {elem.title}
              </text>

              {/* Type pill */}
              <text
                y={68}
                fill="#94a3b8"
                fontSize={10}
                fontFamily="monospace"
                textAnchor="middle"
              >
                [{elem.objectType || 'Generic'}]
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
