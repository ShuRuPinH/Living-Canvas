import { Router } from 'express';
import { asyncHandler, type AuthedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { authService } from '../services/auth.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  })
);

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.token) {
      authService.logout(req.token);
    }
    res.status(204).send();
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = authService.me(req.userId!);
    res.json({ user });
  })
);
