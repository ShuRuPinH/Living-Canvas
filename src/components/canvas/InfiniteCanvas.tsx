import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  CanvasElement,
  CanvasConnection,
  ToolType,
  DisplayMode,
  Point,
  ElementType,
} from '../../types/canvas';
import {
  screenToCanvas,
  snapValueToGrid,
  GRID_SIZE,
  isElementContainedInFrame,
} from '../../utils/canvas';
import { CanvasElementRender } from './CanvasElementRender';
import { CanvasConnectionRender } from './CanvasConnectionRender';
import { QuickActionToolbar } from './QuickActionToolbar';
import { QuickAddHandles } from './QuickAddHandles';

interface InfiniteCanvasProps {
  elements: Record<string, CanvasElement>;
  connections: Record<string, CanvasConnection>;
  selectedElementIds: string[];
  selectedConnectionId: string | null;
  activeTool: ToolType;
  globalDisplayMode: DisplayMode;
  showGrid: boolean;
  snapToGrid: boolean;
  viewport: { x: number; y: number; zoom: number };
  onUpdateViewport: (vp: { x: number; y: number; zoom: number }) => void;
  onSelectElements: (ids: string[]) => void;
  onSelectConnection: (id: string | null) => void;
  onUpdateElement: (element: CanvasElement, saveHistory?: boolean) => void;
  onUpdateElements: (elements: CanvasElement[]) => void;
  onAddElement: (element: CanvasElement) => void;
  onAddConnection: (connection: CanvasConnection) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected?: () => void;
  onOpenDetails: (tab?: 'overview' | 'properties' | 'notes' | 'comments' | 'attachments') => void;
  onOpenStylePicker: () => void;
  onAddChildNode: (parentId: string, direction?: string) => void;
  onBringToFront?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onSendToBack?: () => void;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  elements,
  connections,
  selectedElementIds,
  selectedConnectionId,
  activeTool,
  globalDisplayMode,
  showGrid,
  snapToGrid,
  viewport,
  onUpdateViewport,
  onSelectElements,
  onSelectConnection,
  onUpdateElement,
  onUpdateElements,
  onAddElement,
  onAddConnection,
  onDeleteSelected,
  onDuplicateSelected,
  onOpenDetails,
  onOpenStylePicker,
  onAddChildNode,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [initialElementPositions, setInitialElementPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [initialResizeElem, setInitialResizeElem] = useState<CanvasElement | null>(null);

  const [isRotating, setIsRotating] = useState(false);

  // Connection Drawing Mode
  const [isDrawingConnection, setIsDrawingConnection] = useState(false);
  const [connStartElemId, setConnStartElemId] = useState<string | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<Point>({ x: 0, y: 0 });

  // Freehand Drawing Mode
  const [isDrawingFreehand, setIsDrawingFreehand] = useState(false);
  const [currentFreehandPoints, setCurrentFreehandPoints] = useState<Point[]>([]);

  // Selection Box
  const [isSelectingBox, setIsSelectingBox] = useState(false);
  const [selectionBoxStart, setSelectionBoxStart] = useState<Point>({ x: 0, y: 0 });
  const [selectionBoxCurrent, setSelectionBoxCurrent] = useState<Point>({ x: 0, y: 0 });

  // Spacebar panning key listener
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Global window listeners for mousemove and mouseup to ensure drag never gets stuck
  useEffect(() => {
    if (!isDraggingElement && !isPanning && !isResizing && !isRotating && !isSelectingBox && !isDrawingFreehand) {
      return;
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // If mouse button is no longer held, immediately cancel dragging/panning
      if (e.buttons === 0) {
        setIsPanning(false);
        setIsDraggingElement(false);
        setIsResizing(false);
        setIsRotating(false);
        setIsSelectingBox(false);
        setIsDrawingFreehand(false);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setIsDraggingElement(false);
      setIsResizing(false);
      setIsRotating(false);
      setIsSelectingBox(false);
      setIsDrawingFreehand(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingElement, isPanning, isResizing, isRotating, isSelectingBox, isDrawingFreehand]);

  // Escape listener to cancel connection drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawingConnection) {
        setIsDrawingConnection(false);
        setConnStartElemId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingConnection]);

  // Zoom on wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = Math.min(Math.max(0.2, viewport.zoom * zoomFactor), 3.0);

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const newX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
      const newY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);

      onUpdateViewport({ x: newX, y: newY, zoom: newZoom });
    },
    [viewport, onUpdateViewport]
  );

  // Handle Mousedown
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isSpacePressed || activeTool === 'pan') {
      // Start Canvas Panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      return;
    }

    const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport);

    if (activeTool === 'select') {
      if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
        // Deselect and start selection box
        onSelectElements([]);
        onSelectConnection(null);
        setIsSelectingBox(true);
        setSelectionBoxStart(canvasPoint);
        setSelectionBoxCurrent(canvasPoint);
      }
    } else if (activeTool === 'freehand') {
      setIsDrawingFreehand(true);
      setCurrentFreehandPoints([canvasPoint]);
    } else if (activeTool === 'connection') {
      // Direct click on canvas in connection mode does nothing
    } else if (
      ['rectangle', 'rounded-rectangle', 'circle', 'ellipse', 'diamond', 'text', 'sticky-note', 'frame'].includes(
        activeTool
      )
    ) {
      // Create element at click position
      const newId = `elem-${Date.now()}`;
      const defaultW = activeTool === 'frame' ? 400 : activeTool === 'sticky-note' ? 180 : 160;
      const defaultH = activeTool === 'frame' ? 300 : activeTool === 'sticky-note' ? 160 : 100;

      const snapX = snapToGrid ? snapValueToGrid(canvasPoint.x - defaultW / 2) : canvasPoint.x - defaultW / 2;
      const snapY = snapToGrid ? snapValueToGrid(canvasPoint.y - defaultH / 2) : canvasPoint.y - defaultH / 2;

      const newElem: CanvasElement = {
        id: newId,
        type: activeTool as ElementType,
        x: snapX,
        y: snapY,
        width: defaultW,
        height: defaultH,
        zIndex: activeTool === 'frame' ? 1 : 10,
        title: activeTool === 'frame' ? 'NEW FRAME' : activeTool === 'sticky-note' ? 'Idea Note' : 'New Node',
        objectType: 'Generic',
        tags: [],
        style: {
          fillColor: activeTool === 'sticky-note' ? '#fef08a' : '#ffffff',
          strokeColor: '#64748b',
          strokeWidth: 2,
          textColor: '#0f172a',
          fontSize: 14,
        },
        properties: [],
        notes: [],
        comments: [],
        attachments: [],
        history: [{ id: `h-${Date.now()}`, action: 'Created', details: 'Added new element', timestamp: new Date().toLocaleString() }],
      };

      onAddElement(newElem);
      onSelectElements([newId]);
    }
  };

  // Handle Mousemove
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport);
    setMouseCanvasPos(canvasPoint);

    if (isPanning) {
      onUpdateViewport({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
        zoom: viewport.zoom,
      });
      return;
    }

    if (isSelectingBox) {
      setSelectionBoxCurrent(canvasPoint);
      return;
    }

    if (isDrawingFreehand) {
      setCurrentFreehandPoints((prev) => [...prev, canvasPoint]);
      return;
    }

    if (isDraggingElement && selectedElementIds.length > 0) {
      const dx = canvasPoint.x - dragStartPoint.x;
      const dy = canvasPoint.y - dragStartPoint.y;

      const updatedElems: CanvasElement[] = [];

      selectedElementIds.forEach((id) => {
        const elem = elements[id];
        const initialPos = initialElementPositions[id];
        if (elem && initialPos) {
          let newX = initialPos.x + dx;
          let newY = initialPos.y + dy;

          if (snapToGrid) {
            newX = snapValueToGrid(newX);
            newY = snapValueToGrid(newY);
          }

          updatedElems.push({ ...elem, x: newX, y: newY });

          // If moving a frame, move contained elements too!
          if (elem.type === 'frame') {
            (Object.values(elements) as CanvasElement[]).forEach((childElem) => {
              if (childElem.frameId === elem.id || isElementContainedInFrame(childElem, elem)) {
                const childInitial = initialElementPositions[childElem.id];
                if (childInitial) {
                  let cx = childInitial.x + dx;
                  let cy = childInitial.y + dy;
                  if (snapToGrid) {
                    cx = snapValueToGrid(cx);
                    cy = snapValueToGrid(cy);
                  }
                  updatedElems.push({ ...childElem, x: cx, y: cy });
                }
              }
            });
          }
        }
      });

      onUpdateElements(updatedElems);
      return;
    }

    if (isResizing && selectedElementIds.length === 1 && initialResizeElem) {
      const elem = initialResizeElem;
      let newX = elem.x;
      let newY = elem.y;
      let newW = elem.width;
      let newH = elem.height;

      const dx = canvasPoint.x - dragStartPoint.x;
      const dy = canvasPoint.y - dragStartPoint.y;

      switch (resizeHandle) {
        case 'se':
          newW = Math.max(60, elem.width + dx);
          newH = Math.max(40, elem.height + dy);
          break;
        case 'e':
          newW = Math.max(60, elem.width + dx);
          break;
        case 's':
          newH = Math.max(40, elem.height + dy);
          break;
        case 'nw':
          newW = Math.max(60, elem.width - dx);
          newH = Math.max(40, elem.height - dy);
          newX = elem.x + (elem.width - newW);
          newY = elem.y + (elem.height - newH);
          break;
        case 'w':
          newW = Math.max(60, elem.width - dx);
          newX = elem.x + (elem.width - newW);
          break;
        case 'n':
          newH = Math.max(40, elem.height - dy);
          newY = elem.y + (elem.height - newH);
          break;
      }

      if (snapToGrid) {
        newW = snapValueToGrid(newW);
        newH = snapValueToGrid(newH);
      }

      onUpdateElement({ ...elem, x: newX, y: newY, width: newW, height: newH }, false);
      return;
    }

    if (isRotating && selectedElementIds.length === 1) {
      const selectedId = selectedElementIds[0];
      const elem = elements[selectedId];
      if (elem) {
        const centerX = elem.x + elem.width / 2;
        const centerY = elem.y + elem.height / 2;
        const radians = Math.atan2(canvasPoint.y - centerY, canvasPoint.x - centerX);
        let degrees = Math.round(radians * (180 / Math.PI)) - 90; // -90 offset for top-right handle orientation
        if (degrees < 0) degrees += 360;
        if (snapToGrid) {
          degrees = Math.round(degrees / 15) * 15; // Snap to 15 degree intervals
        }
        onUpdateElement({ ...elem, rotation: degrees }, false);
        return;
      }
    }
  };

  // Handle Mouseup
  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingElement(false);
    setIsResizing(false);
    setIsRotating(false);

    if (isSelectingBox) {
      setIsSelectingBox(false);
      // Find all elements inside selection box
      const minX = Math.min(selectionBoxStart.x, selectionBoxCurrent.x);
      const maxX = Math.max(selectionBoxStart.x, selectionBoxCurrent.x);
      const minY = Math.min(selectionBoxStart.y, selectionBoxCurrent.y);
      const maxY = Math.max(selectionBoxStart.y, selectionBoxCurrent.y);

      const matchedIds = (Object.values(elements) as CanvasElement[])
        .filter(
          (e) => e.x >= minX && e.x + e.width <= maxX && e.y >= minY && e.y + e.height <= maxY
        )
        .map((e) => e.id);

      onSelectElements(matchedIds);
    }

    if (isDrawingFreehand && currentFreehandPoints.length > 1) {
      setIsDrawingFreehand(false);
      const newElem: CanvasElement = {
        id: `freehand-${Date.now()}`,
        type: 'freehand',
        x: currentFreehandPoints[0].x,
        y: currentFreehandPoints[0].y,
        width: 200,
        height: 200,
        zIndex: 10,
        title: 'Drawing Stroke',
        freehandPoints: currentFreehandPoints,
        tags: [],
        style: { strokeColor: '#3b82f6', strokeWidth: 3 },
        properties: [],
        notes: [],
        comments: [],
        attachments: [],
        history: [],
      };
      onAddElement(newElem);
      setCurrentFreehandPoints([]);
    }
  };

  // Element Mouse Down Handler
  const handleElementMouseDown = (e: React.MouseEvent, elem: CanvasElement) => {
    e.stopPropagation();

    if (activeTool === 'connection' || isDrawingConnection) {
      if (!connStartElemId) {
        // Start connection draw
        setConnStartElemId(elem.id);
        setIsDrawingConnection(true);
      } else if (connStartElemId !== elem.id) {
        // Complete connection draw
        const newConn: CanvasConnection = {
          id: `conn-${Date.now()}`,
          sourceId: connStartElemId,
          targetId: elem.id,
          label: 'Connection',
          connectionType: 'HTTP',
          style: { strokeColor: '#6366f1', strokeWidth: 2, lineCurve: 'curved' },
          properties: [],
          comments: [],
        };
        onAddConnection(newConn);
        setIsDrawingConnection(false);
        setConnStartElemId(null);
      }
      return;
    }

    // Select Element
    if (!selectedElementIds.includes(elem.id)) {
      if (e.shiftKey) {
        onSelectElements([...selectedElementIds, elem.id]);
      } else {
        onSelectElements([elem.id]);
        onSelectConnection(null);
      }
    }

    // Prepare Dragging
    const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport);
    setIsDraggingElement(true);
    setDragStartPoint(canvasPoint);

    const posMap: Record<string, { x: number; y: number }> = {};
    (Object.values(elements) as CanvasElement[]).forEach((el) => {
      posMap[el.id] = { x: el.x, y: el.y };
    });
    setInitialElementPositions(posMap);
  };

  // Count connections for each element
  const connectionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    (Object.values(connections) as CanvasConnection[]).forEach((c) => {
      counts[c.sourceId] = (counts[c.sourceId] || 0) + 1;
      counts[c.targetId] = (counts[c.targetId] || 0) + 1;
    });
    return counts;
  }, [connections]);

  // Sorted elements by zIndex for correct layer rendering
  const sortedElements = React.useMemo(() => {
    return (Object.values(elements) as CanvasElement[]).sort(
      (a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1)
    );
  }, [elements]);

  const selectedElem =
    selectedElementIds.length === 1 ? elements[selectedElementIds[0]] : undefined;
  const selectedConn = selectedConnectionId ? connections[selectedConnectionId] : undefined;

  return (
    <div
      ref={canvasRef}
      className={`w-full h-full relative overflow-hidden bg-slate-50 dark:bg-slate-950 select-none ${
        isPanning || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Infinite Grid Background */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, #64748b 1px, transparent 1px)`,
            backgroundSize: `${GRID_SIZE * viewport.zoom}px ${GRID_SIZE * viewport.zoom}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          }}
        />
      )}

      {/* Main Canvas Viewport Container */}
      <div
        className="absolute inset-0 origin-top-left pointer-events-none"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {/* Render Connections SVG Layer */}
        <svg className="w-full h-full overflow-visible absolute inset-0 pointer-events-none" style={{ zIndex: 1000 }}>
          {(Object.values(connections) as CanvasConnection[]).map((conn) => (
            <CanvasConnectionRender
              key={conn.id}
              connection={conn}
              sourceElem={elements[conn.sourceId]}
              targetElem={elements[conn.targetId]}
              isSelected={selectedConnectionId === conn.id}
              onSelect={(_, c) => {
                onSelectConnection(c.id);
                onSelectElements([]);
              }}
            />
          ))}

          {/* Active Connection Drawing Line Preview */}
          {isDrawingConnection && connStartElemId && elements[connStartElemId] && (
            <line
              x1={elements[connStartElemId].x + elements[connStartElemId].width / 2}
              y1={elements[connStartElemId].y + elements[connStartElemId].height / 2}
              x2={mouseCanvasPos.x}
              y2={mouseCanvasPos.y}
              stroke="#6366f1"
              strokeWidth={3}
              strokeDasharray="6 4"
            />
          )}

          {/* Active Freehand Path Preview */}
          {isDrawingFreehand && currentFreehandPoints.length > 1 && (
            <path
              d={`M ${currentFreehandPoints[0].x} ${currentFreehandPoints[0].y} ` +
                currentFreehandPoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}

          {/* Selection Box Preview */}
          {isSelectingBox && (
            <rect
              x={Math.min(selectionBoxStart.x, selectionBoxCurrent.x)}
              y={Math.min(selectionBoxStart.y, selectionBoxCurrent.y)}
              width={Math.abs(selectionBoxCurrent.x - selectionBoxStart.x)}
              height={Math.abs(selectionBoxCurrent.y - selectionBoxStart.y)}
              fill="rgba(99, 102, 241, 0.15)"
              stroke="#6366f1"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          )}
        </svg>

        {/* Render Canvas Elements Layer */}
        {sortedElements.map((elem) => (
          <CanvasElementRender
            key={elem.id}
            element={elem}
            isSelected={selectedElementIds.includes(elem.id)}
            globalDisplayMode={globalDisplayMode}
            connectionsCount={connectionCounts[elem.id] || 0}
            onSelect={(e, el) => handleElementMouseDown(e, el)}
            onDoubleClick={onOpenDetails}
            onMouseDownResize={(e, handle) => {
              e.stopPropagation();
              setIsResizing(true);
              setResizeHandle(handle);
              setInitialResizeElem(elem);
              const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY }, viewport);
              setDragStartPoint(canvasPoint);
            }}
            onMouseDownRotate={(e) => {
              e.stopPropagation();
              setIsRotating(true);
            }}
            onMouseDownMove={(e, el) => handleElementMouseDown(e, el)}
          />
        ))}
      </div>

      {/* 1-Click Directional Quick Add Handles on Single Selected Node */}
      {selectedElem && selectedElementIds.length === 1 && (
        <QuickAddHandles
          element={selectedElem}
          viewport={viewport}
          onQuickAddDirection={(direction) => onAddChildNode(selectedElem.id, direction)}
        />
      )}

      {/* Floating Context Action Toolbar above selection */}
      <QuickActionToolbar
        selectedElement={selectedElem}
        selectedConnection={selectedConn}
        viewport={viewport}
        onAddChild={() => selectedElem && onAddChildNode(selectedElem.id, 'right')}
        onConnectMode={() => {
          if (selectedElem) {
            setConnStartElemId(selectedElem.id);
            setIsDrawingConnection(true);
          }
        }}
        onAddNote={() => onOpenDetails('notes')}
        onAddComment={() => onOpenDetails('comments')}
        onAddProperty={() => onOpenDetails('properties')}
        onOpenStylePicker={onOpenStylePicker}
        onBringToFront={onBringToFront}
        onBringForward={onBringForward}
        onSendBackward={onSendBackward}
        onSendToBack={onSendToBack}
        onDuplicate={() => {
          if (onDuplicateSelected) {
            onDuplicateSelected();
          } else if (selectedElem) {
            const dup: CanvasElement = {
              ...selectedElem,
              id: `elem-${Date.now()}`,
              x: selectedElem.x + 30,
              y: selectedElem.y + 30,
              title: `${selectedElem.title} (Copy)`,
            };
            onAddElement(dup);
            onSelectElements([dup.id]);
          }
        }}
        onDelete={onDeleteSelected}
        onOpenDetails={(tab) => onOpenDetails(tab || 'overview')}
      />

      {/* Active Connection Drawing Banner Toast */}
      {isDrawingConnection && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-xl font-medium text-xs flex items-center gap-2 select-none animate-in fade-in slide-in-from-top-4">
          <span>Click target block to connect (or press Esc / click ✕)</span>
          <button
            onClick={() => {
              setIsDrawingConnection(false);
              setConnStartElemId(null);
            }}
            className="ml-1 p-0.5 hover:bg-indigo-700 rounded-full cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
