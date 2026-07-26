import React, { useEffect, useState } from 'react';
import App from './App';
import { AuthGate } from './components/auth/AuthGate';
import {
  authApi,
  boardsApi,
  clearAuth,
  getStoredToken,
  getStoredUser,
  type ApiUser,
} from './api/client';
import { CanvasBoardState } from './types/canvas';
import { saveBoardState } from './utils/storage';
import { setRemoteBoardSync } from './utils/remoteSync';

type BootState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'ready'; user: ApiUser; board: CanvasBoardState }
  | { status: 'error'; message: string };

export default function Root() {
  const [boot, setBoot] = useState<BootState>({ status: 'loading' });

  const bootstrap = async (user: ApiUser) => {
    setBoot({ status: 'loading' });
    try {
      const { boards } = await boardsApi.list();
      let boardId = boards[0]?.id;
      if (!boardId) {
        const created = await boardsApi.create('My First Canvas');
        boardId = (created.board as CanvasBoardState).id;
      }
      const { board } = await boardsApi.get(boardId);
      const boardState = board as CanvasBoardState;
      saveBoardState(boardState);
      setRemoteBoardSync({
        boardId: boardState.id,
        enabled: true,
      });
      setBoot({ status: 'ready', user, board: boardState });
    } catch (err) {
      clearAuth();
      setRemoteBoardSync({ boardId: null, enabled: false });
      setBoot({
        status: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to load boards from API',
      });
    }
  };

  useEffect(() => {
    const token = getStoredToken();
    const cachedUser = getStoredUser();
    if (!token || !cachedUser) {
      setBoot({ status: 'unauthenticated' });
      return;
    }

    authApi
      .me()
      .then(({ user }) => bootstrap(user))
      .catch(() => {
        clearAuth();
        setBoot({ status: 'unauthenticated' });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    setRemoteBoardSync({ boardId: null, enabled: false });
    await authApi.logout();
    setBoot({ status: 'unauthenticated' });
  };

  if (boot.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600 text-sm">
        Loading Living Canvas…
      </div>
    );
  }

  if (boot.status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-100 px-4">
        <p className="text-sm text-rose-700">{boot.message}</p>
        <button
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
          onClick={() => setBoot({ status: 'unauthenticated' })}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (boot.status === 'unauthenticated') {
    return (
      <AuthGate
        onAuthenticated={(user) => {
          void bootstrap(user);
        }}
      />
    );
  }

  return (
    <div key={boot.board.id} className="contents">
      <App
        initialBoard={boot.board}
        currentUser={boot.user}
        onLogout={handleLogout}
      />
    </div>
  );
}
