import React, { useState } from 'react';
import { authApi, storeAuth, type ApiUser, ApiError } from '../../api/client';

type Mode = 'login' | 'register';

type AuthGateProps = {
  onAuthenticated: (user: ApiUser) => void;
};

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result =
        mode === 'login'
          ? await authApi.login({ email, password })
          : await authApi.register({
              email,
              password,
              displayName: displayName || undefined,
            });
      storeAuth(result);
      onAuthenticated(result.user);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to reach the API. Is the server running?');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Living Canvas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'login'
              ? 'Sign in to open your knowledge boards'
              : 'Create an account to store boards in SQLite'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Display name
              </span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex"
                autoComplete="name"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Email</span>
            <input
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Password
            </span>
            <input
              type="password"
              required
              minLength={mode === 'register' ? 8 : 1}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button
                type="button"
                className="font-medium text-slate-900 underline-offset-2 hover:underline"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button
                type="button"
                className="font-medium text-slate-900 underline-offset-2 hover:underline"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
