import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { isAppError } from '../errors.js';
import { authService } from '../services/auth.js';

export type AuthedRequest = Request & {
  userId?: string;
  sessionId?: string;
  token?: string;
};

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token', code: 'UNAUTHORIZED' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token', code: 'UNAUTHORIZED' });
  }

  try {
    const payload = authService.verifyAccessToken(token);
    req.userId = payload.sub;
    req.sessionId = payload.sid;
    req.token = token;
    next();
  } catch (err) {
    if (isAppError(err)) {
      return res.status(err.statusCode).json({ error: err.message, code: err.code });
    }
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.flatten(),
    });
  }

  if (isAppError(err)) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  console.error('[api]', err);
  return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL' });
}

export function asyncHandler(
  fn: (req: AuthedRequest, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
