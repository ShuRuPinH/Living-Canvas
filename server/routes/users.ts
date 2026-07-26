import { Router } from 'express';
import { asyncHandler, requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { usersService } from '../services/users.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get(
  '/me',
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = usersService.getProfile(req.userId!);
    res.json(profile);
  })
);

usersRouter.patch(
  '/me',
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = usersService.updateProfile(req.userId!, req.body);
    res.json(profile);
  })
);
