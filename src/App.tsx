import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  CanvasElement,
  CanvasConnection,
  ToolType,
  ViewMode,
  DisplayMode,
  ElementType,
} from './types/canvas';
import {
  loadBoardState,
  exportBoardToJSON,
  importBoardFromJSON,
  resetBoardToDemo,
} from './utils/storage';
import { useCanvasHistory } from './hooks/useCanvasHistory';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import { TopToolbar } from './components/toolbar/TopToolbar';
import { LeftToolbar } from './components/toolbar/LeftToolbar';
import { StylePickerPopover } from './components/toolbar/StylePickerPopover';
import { InfiniteCanvas } from './components/canvas/InfiniteCanvas';
import { EntityDetailsPanel } from './components/panel/EntityDetailsPanel';
import { SearchModal } from './components/panel/SearchModal';

import { ListView } from './components/views/ListView';
import { GraphView } from './components/views/GraphView';
import { BoardView } from './components/views/BoardView';
import { KeyboardShortcutsModal } from './components/views/KeyboardShortcutsModal';

export default function App() {
  const initialState = loadBoardState();
  const { boardState, setBoardState, undo, redo, canUndo, canRedo } =
    useCanvasHistory(initialState);

  // Active Tool & View
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeView, setActiveView] = useState<ViewMode>('canvas');
  const [globalDisplayMode, setGlobalDisplayMode] = useState<DisplayMode>(
    boardState.globalDisplayMode || 'compact'
  );

  // Canvas Viewport
  const [viewport, setViewport] = useState(
    boardState.viewport || { x: 100, y: 80, zoom: 0.9 }
  );

  // Selection state
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // Modals & Panels
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [detailsTab, setDetailsTab] = useState<
    'overview' | 'properties' | 'notes' | 'comments' | 'attachments' | 'connections' | 'history'
  >('overview');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const handleOpenDetails = (
    tab: 'overview' | 'properties' | 'notes' | 'comments' | 'attachments' = 'overview'
  ) => {
    setDetailsTab(tab);
    setShowDetailsPanel(true);
  };

  // Hidden File Input for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update Board Name
  const handleUpdateBoardName = (name: string) => {
    setBoardState((prev) => ({ ...prev, name }));
  };

  // Add Single Element
  const handleAddElement = (newElem: CanvasElement) => {
    setBoardState((prev) => ({
      ...prev,
      elements: { ...prev.elements, [newElem.id]: newElem },
    }));
  };

  // Update Single Element
  const handleUpdateElement = (updatedElem: CanvasElement, saveHistory = true) => {
    setBoardState(
      (prev) => ({
        ...prev,
        elements: { ...prev.elements, [updatedElem.id]: updatedElem },
      }),
      saveHistory
    );
  };

  // Update Multiple Elements (batch dragging/moving)
  const handleUpdateElements = (updatedList: CanvasElement[]) => {
    setBoardState((prev) => {
      const nextElements = { ...prev.elements };
      updatedList.forEach((el) => {
        nextElements[el.id] = el;
      });
      return { ...prev, elements: nextElements };
    });
  };

  // Add Connection
  const handleAddConnection = (newConn: CanvasConnection) => {
    setBoardState((prev) => ({
      ...prev,
      connections: { ...prev.connections, [newConn.id]: newConn },
    }));
  };

  // Update Connection
  const handleUpdateConnection = (updatedConn: CanvasConnection) => {
    setBoardState((prev) => ({
      ...prev,
      connections: { ...prev.connections, [updatedConn.id]: updatedConn },
    }));
  };

  // Delete Selected Elements or Connection
  const handleDeleteSelected = useCallback(() => {
    setBoardState((prev) => {
      const nextElements = { ...prev.elements };
      const nextConnections = { ...prev.connections };

      // Remove selected elements
      selectedElementIds.forEach((id) => {
        delete nextElements[id];
      });

      // Remove selected connection
      if (selectedConnectionId) {
        delete nextConnections[selectedConnectionId];
      }

      // Also clean up any orphan connections whose source or target was deleted
      Object.keys(nextConnections).forEach((cId) => {
        const conn = nextConnections[cId];
        if (!nextElements[conn.sourceId] || !nextElements[conn.targetId]) {
          delete nextConnections[cId];
        }
      });

      return {
        ...prev,
        elements: nextElements,
        connections: nextConnections,
      };
    });

    setSelectedElementIds([]);
    setSelectedConnectionId(null);
  }, [selectedElementIds, selectedConnectionId, setBoardState]);

  // Duplicate Selected Elements
  const handleDuplicateSelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    setBoardState((prev) => {
      const nextElements = { ...prev.elements };
      const newSelectedIds: string[] = [];

      selectedElementIds.forEach((id) => {
        const target = prev.elements[id];
        if (target) {
          const newId = `elem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          const dup: CanvasElement = {
            ...target,
            id: newId,
            x: target.x + 30,
            y: target.y + 30,
            title: `${target.title} (Copy)`,
          };
          nextElements[newId] = dup;
          newSelectedIds.push(newId);
        }
      });

      return { ...prev, elements: nextElements };
    });
  }, [selectedElementIds, setBoardState]);

  // Layer Ordering Handlers (Z-Index)
  const handleBringToFront = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    setBoardState((prev) => {
      const allZ = (Object.values(prev.elements) as CanvasElement[]).map((e) => e.zIndex ?? 1);
      const maxZ = allZ.length ? Math.max(...allZ, 1) : 1;
      const nextElements = { ...prev.elements };
      selectedElementIds.forEach((id, idx) => {
        if (nextElements[id]) {
          nextElements[id] = { ...nextElements[id], zIndex: maxZ + 1 + idx };
        }
      });
      return { ...prev, elements: nextElements };
    });
  }, [selectedElementIds, setBoardState]);

  const handleSendToBack = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    setBoardState((prev) => {
      const allZ = (Object.values(prev.elements) as CanvasElement[]).map((e) => e.zIndex ?? 1);
      const minZ = allZ.length ? Math.min(...allZ, 1) : 1;
      const nextElements = { ...prev.elements };
      selectedElementIds.forEach((id, idx) => {
        if (nextElements[id]) {
          nextElements[id] = { ...nextElements[id], zIndex: Math.max(0, minZ - 1 - idx) };
        }
      });
      return { ...prev, elements: nextElements };
    });
  }, [selectedElementIds, setBoardState]);

  const handleBringForward = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    setBoardState((prev) => {
      const nextElements = { ...prev.elements };
      selectedElementIds.forEach((id) => {
        if (nextElements[id]) {
          nextElements[id] = { ...nextElements[id], zIndex: (nextElements[id].zIndex ?? 1) + 1 };
        }
      });
      return { ...prev, elements: nextElements };
    });
  }, [selectedElementIds, setBoardState]);

  const handleSendBackward = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    setBoardState((prev) => {
      const nextElements = { ...prev.elements };
      selectedElementIds.forEach((id) => {
        if (nextElements[id]) {
          nextElements[id] = { ...nextElements[id], zIndex: Math.max(0, (nextElements[id].zIndex ?? 1) - 1) };
        }
      });
      return { ...prev, elements: nextElements };
    });
  }, [selectedElementIds, setBoardState]);

  // Global Keyboard Shortcuts for Layer Ordering
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (selectedElementIds.length > 0) {
        if (e.key === ']') {
          e.preventDefault();
          if (e.shiftKey) {
            handleBringToFront();
          } else {
            handleBringForward();
          }
        } else if (e.key === '[') {
          e.preventDefault();
          if (e.shiftKey) {
            handleSendToBack();
          } else {
            handleSendBackward();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, handleBringToFront, handleBringForward, handleSendBackward, handleSendToBack]);

  // Quick Add Child Node in direction
  const handleAddChildNode = useCallback(
    (parentId: string, direction = 'right') => {
      const parent = boardState.elements[parentId];
      if (!parent) return;

      let dx = 220;
      let dy = 0;

      if (direction === 'top') {
        dx = 0;
        dy = -180;
      } else if (direction === 'bottom') {
        dx = 0;
        dy = 180;
      } else if (direction === 'left') {
        dx = -220;
        dy = 0;
      }

      const childId = `elem-${Date.now()}`;
      const childNode: CanvasElement = {
        id: childId,
        type: 'rounded-rectangle',
        x: parent.x + dx,
        y: parent.y + dy,
        width: 170,
        height: 100,
        zIndex: 10,
        title: 'New Knowledge Entity',
        objectType: 'Generic',
        tags: [],
        style: {
          fillColor: '#ffffff',
          strokeColor: '#6366f1',
          strokeWidth: 2,
          textColor: '#0f172a',
          fontSize: 14,
          cornerRadius: 12,
        },
        properties: [],
        notes: [],
        comments: [],
        attachments: [],
        history: [{ id: `h-${Date.now()}`, action: 'Created', details: 'Added child node', timestamp: new Date().toLocaleString() }],
      };

      const newConn: CanvasConnection = {
        id: `conn-${Date.now()}`,
        sourceId: parentId,
        targetId: childId,
        label: 'Connects to',
        style: { strokeColor: '#6366f1', strokeWidth: 2, lineCurve: 'curved' },
        properties: [],
        comments: [],
      };

      setBoardState((prev) => ({
        ...prev,
        elements: { ...prev.elements, [childId]: childNode },
        connections: { ...prev.connections, [newConn.id]: newConn },
      }));

      setSelectedElementIds([childId]);
    },
    [boardState.elements, setBoardState]
  );

  // Hotkeys Hook
  useKeyboardShortcuts({
    onSelectTool: setActiveTool,
    onUndo: undo,
    onRedo: redo,
    onDeleteSelected: handleDeleteSelected,
    onDuplicateSelected: handleDuplicateSelected,
    onOpenSearch: () => setShowSearchModal(true),
    onAddChild: () => {
      if (selectedElementIds.length === 1) {
        handleAddChildNode(selectedElementIds[0], 'right');
      }
    },
  });

  // JSON Import Trigger
  const handleImportJSONClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importBoardFromJSON(file);
      setBoardState(imported);
      if (imported.viewport) setViewport(imported.viewport);
      alert('Knowledge Board successfully imported!');
    } catch (err) {
      alert('Failed to import JSON file. Please check file format.');
    }
  };

  // Reset Board Demo
  const handleResetDemo = () => {
    if (confirm('Reset canvas to demo architecture map? Any unsaved edits will be lost.')) {
      const demo = resetBoardToDemo();
      setBoardState(demo);
      setViewport(demo.viewport);
      setSelectedElementIds([]);
      setSelectedConnectionId(null);
    }
  };

  // Export Canvas Image (creates clean SVG/Canvas snapshot download)
  const handleExportPNG = () => {
    const elem = document.querySelector('svg');
    if (!elem) return;
    alert('Exporting Canvas view snapshot image to your downloads...');
    exportBoardToJSON(boardState, `${boardState.name.toLowerCase().replace(/\s+/g, '-')}-backup.json`);
  };

  // Center/Fit Screen Viewport
  const handleFitScreen = () => {
    const elemList = Object.values(boardState.elements) as CanvasElement[];
    if (elemList.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elemList.forEach((el) => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const scaleX = (window.innerWidth - 120) / contentWidth;
    const scaleY = (window.innerHeight - 120) / contentHeight;
    const zoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.4), 1.2);

    const x = (window.innerWidth - contentWidth * zoom) / 2 - minX * zoom;
    const y = (window.innerHeight - contentHeight * zoom) / 2 - minY * zoom;

    setViewport({ x, y, zoom });
  };

  const selectedElem =
    selectedElementIds.length === 1 ? boardState.elements[selectedElementIds[0]] : undefined;
  const selectedConn = selectedConnectionId
    ? boardState.connections[selectedConnectionId]
    : undefined;

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col relative font-sans">
      {/* Hidden File Input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Top Bar Navigation */}
      <TopToolbar
        boardName={boardState.name || 'Living Canvas'}
        onUpdateBoardName={handleUpdateBoardName}
        activeView={activeView}
        onChangeView={setActiveView}
        globalDisplayMode={globalDisplayMode}
        onChangeDisplayMode={setGlobalDisplayMode}
        zoom={viewport.zoom}
        onZoomIn={() => setViewport((v) => ({ ...v, zoom: Math.min(v.zoom * 1.15, 3) }))}
        onZoomOut={() => setViewport((v) => ({ ...v, zoom: Math.max(v.zoom * 0.85, 0.2) }))}
        onResetZoom={() => setViewport((v) => ({ ...v, zoom: 1 }))}
        onFitScreen={handleFitScreen}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        showGrid={boardState.showGrid ?? true}
        snapToGrid={boardState.snapToGrid ?? true}
        onToggleGrid={() =>
          setBoardState((p) => ({ ...p, showGrid: !(p.showGrid ?? true) }))
        }
        onToggleSnap={() =>
          setBoardState((p) => ({ ...p, snapToGrid: !(p.snapToGrid ?? true) }))
        }
        onOpenSearch={() => setShowSearchModal(true)}
        onExportJSON={() => exportBoardToJSON(boardState)}
        onImportJSON={handleImportJSONClick}
        onExportPNG={handleExportPNG}
        onResetDemo={handleResetDemo}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
      />

      {/* Main Views Container */}
      <main className="flex-1 w-full h-full relative">
        {activeView === 'canvas' && (
          <>
            <LeftToolbar
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              onAddShape={(type: ElementType) => {
                setActiveTool(type as ToolType);
              }}
            />

            <InfiniteCanvas
              elements={boardState.elements}
              connections={boardState.connections}
              selectedElementIds={selectedElementIds}
              selectedConnectionId={selectedConnectionId}
              activeTool={activeTool}
              globalDisplayMode={globalDisplayMode}
              showGrid={boardState.showGrid ?? true}
              snapToGrid={boardState.snapToGrid ?? true}
              viewport={viewport}
              onUpdateViewport={setViewport}
              onSelectElements={(ids) => {
                setSelectedElementIds(ids);
                if (ids.length > 0) setSelectedConnectionId(null);
              }}
              onSelectConnection={(id) => {
                setSelectedConnectionId(id);
                if (id) setSelectedElementIds([]);
              }}
              onUpdateElement={handleUpdateElement}
              onUpdateElements={handleUpdateElements}
              onAddElement={handleAddElement}
              onAddConnection={handleAddConnection}
              onDeleteSelected={handleDeleteSelected}
              onOpenDetails={handleOpenDetails}
              onOpenStylePicker={() => setShowStylePicker((prev) => !prev)}
              onAddChildNode={handleAddChildNode}
              onBringToFront={handleBringToFront}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onSendToBack={handleSendToBack}
            />
          </>
        )}

        {activeView === 'list' && (
          <ListView
            elements={boardState.elements}
            connections={boardState.connections}
            onSelectElement={(elem) => {
              setSelectedElementIds([elem.id]);
              handleOpenDetails('overview');
            }}
          />
        )}

        {activeView === 'graph' && (
          <GraphView
            elements={boardState.elements}
            connections={boardState.connections}
            onSelectElement={(elem) => {
              setSelectedElementIds([elem.id]);
              handleOpenDetails('overview');
            }}
          />
        )}

        {activeView === 'board' && (
          <BoardView
            elements={boardState.elements}
            onSelectElement={(elem) => {
              setSelectedElementIds([elem.id]);
              handleOpenDetails('overview');
            }}
          />
        )}
      </main>

      {/* Entity Details Right Panel Drawer */}
      {showDetailsPanel && (selectedElem || selectedConn) && (
        <EntityDetailsPanel
          element={selectedElem}
          connection={selectedConn}
          allElements={boardState.elements}
          initialTab={detailsTab}
          onUpdateElement={handleUpdateElement}
          onUpdateConnection={handleUpdateConnection}
          onClose={() => setShowDetailsPanel(false)}
          onJumpToElement={(id) => {
            const target = boardState.elements[id];
            if (target) {
              setViewport({
                x: window.innerWidth / 2 - target.x * viewport.zoom,
                y: window.innerHeight / 2 - target.y * viewport.zoom,
                zoom: viewport.zoom,
              });
              setSelectedElementIds([id]);
            }
          }}
          onBringToFront={handleBringToFront}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onSendToBack={handleSendToBack}
        />
      )}

      {/* Visual Style Inspector Popover */}
      {showStylePicker && selectedElem && (
        <StylePickerPopover
          styleConfig={selectedElem.style || {}}
          isStickyNote={selectedElem.type === 'sticky-note'}
          onUpdateStyle={(newStyle) => {
            handleUpdateElement({
              ...selectedElem,
              style: { ...selectedElem.style, ...newStyle },
            });
          }}
          onBringToFront={handleBringToFront}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onSendToBack={handleSendToBack}
          onClose={() => setShowStylePicker(false)}
        />
      )}

      {/* Global Search Modal */}
      {showSearchModal && (
        <SearchModal
          elements={boardState.elements}
          connections={boardState.connections}
          onSelectResult={(type, id) => {
            if (type === 'element') {
              const target = boardState.elements[id];
              if (target) {
                setViewport({
                  x: window.innerWidth / 2 - (target.x + target.width / 2) * viewport.zoom,
                  y: window.innerHeight / 2 - (target.y + target.height / 2) * viewport.zoom,
                  zoom: viewport.zoom,
                });
                setSelectedElementIds([id]);
                setSelectedConnectionId(null);
              }
            } else if (type === 'connection') {
              setSelectedConnectionId(id);
              setSelectedElementIds([]);
            }
            setShowDetailsPanel(true);
          }}
          onClose={() => setShowSearchModal(false)}
        />
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
}
