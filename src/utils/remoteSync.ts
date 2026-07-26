import { boardsApi } from '../api/client';
import type { CanvasBoardState } from '../types/canvas';

type SyncConfig = {
  boardId: string | null;
  enabled: boolean;
};

let syncConfig: SyncConfig = { boardId: null, enabled: false };
let timer: ReturnType<typeof setTimeout> | null = null;
let pending: CanvasBoardState | null = null;

export function setRemoteBoardSync(config: SyncConfig) {
  syncConfig = config;
}

export function queueRemoteBoardSave(state: CanvasBoardState) {
  if (!syncConfig.enabled || !syncConfig.boardId) return;
  pending = { ...state, id: syncConfig.boardId };
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    const payload = pending;
    pending = null;
    if (!payload || !syncConfig.boardId) return;
    boardsApi.save(syncConfig.boardId, payload).catch((err) => {
      console.error('Failed to sync board to API:', err);
    });
  }, 600);
}
