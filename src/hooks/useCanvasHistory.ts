import { useState, useCallback, useRef } from 'react';
import { CanvasBoardState } from '../types/canvas';
import { saveBoardState } from '../utils/storage';

const MAX_HISTORY = 50;

export function useCanvasHistory(initialState: CanvasBoardState) {
  const [past, setPast] = useState<CanvasBoardState[]>([]);
  const [present, setPresent] = useState<CanvasBoardState>(initialState);
  const [future, setFuture] = useState<CanvasBoardState[]>([]);

  // Ref to hold the current present state for immediate reading in callbacks
  const presentRef = useRef(present);
  presentRef.current = present;

  const setBoardState = useCallback(
    (
      action: CanvasBoardState | ((prev: CanvasBoardState) => CanvasBoardState),
      saveToHistory = true
    ) => {
      setPresent((prevPresent) => {
        const nextState = typeof action === 'function' ? action(prevPresent) : action;

        if (saveToHistory) {
          setPast((prevPast) => {
            const updatedPast = [...prevPast, prevPresent];
            if (updatedPast.length > MAX_HISTORY) {
              return updatedPast.slice(updatedPast.length - MAX_HISTORY);
            }
            return updatedPast;
          });
          setFuture([]);
        }

        saveBoardState(nextState);
        return nextState;
      });
    },
    []
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture([presentRef.current, ...future]);
    setPresent(previous);
    saveBoardState(previous);
  }, [past, future]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast([...past, presentRef.current]);
    setPresent(next);
    setFuture(newFuture);
    saveBoardState(next);
  }, [past, future]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return {
    boardState: present,
    setBoardState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
