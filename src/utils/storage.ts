import { CanvasBoardState } from '../types/canvas';
import { DEMO_BOARD_STATE } from '../constants/templates';
import { queueRemoteBoardSave } from './remoteSync';

const STORAGE_KEY = 'living_canvas_board_data_v1';

export function loadBoardState(): CanvasBoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEMO_BOARD_STATE;
    }
    const parsed = JSON.parse(raw) as CanvasBoardState;
    if (!parsed.elements || !parsed.connections) {
      return DEMO_BOARD_STATE;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load board state from localStorage:', error);
    return DEMO_BOARD_STATE;
  }
}

export function saveBoardState(state: CanvasBoardState): boolean {
  try {
    const stateToSave = {
      ...state,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    queueRemoteBoardSave(stateToSave);
    return true;
  } catch (error) {
    console.error('Failed to save board state:', error);
    return false;
  }
}

export function exportBoardToJSON(state: CanvasBoardState, filename = 'living-canvas-board.json') {
  const jsonString = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importBoardFromJSON(file: File): Promise<CanvasBoardState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as CanvasBoardState;
        if (!parsed || typeof parsed !== 'object' || !parsed.elements) {
          throw new Error('Invalid JSON format for Living Canvas');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

export function resetBoardToDemo(): CanvasBoardState {
  saveBoardState(DEMO_BOARD_STATE);
  return DEMO_BOARD_STATE;
}

export function createEmptyBoard(name = 'Untitled Canvas'): CanvasBoardState {
  const emptyState: CanvasBoardState = {
    id: `board-${Date.now()}`,
    name,
    updatedAt: new Date().toISOString(),
    globalDisplayMode: 'compact',
    snapToGrid: true,
    showGrid: true,
    viewport: { x: 200, y: 150, zoom: 1 },
    elements: {},
    connections: {},
  };
  saveBoardState(emptyState);
  return emptyState;
}
