import { Router } from 'express';
import { asyncHandler, requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { boardsService } from '../services/boards.js';

export const boardsRouter = Router();

boardsRouter.use(requireAuth);

boardsRouter.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const boards = boardsService.list(req.userId!);
    res.json({ boards });
  })
);

boardsRouter.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const board = boardsService.create(req.userId!, req.body);
    res.status(201).json({ board });
  })
);

boardsRouter.get(
  '/:boardId/architecture',
  asyncHandler(async (req: AuthedRequest, res) => {
    const architecture = boardsService.exportArchitecture(
      req.userId!,
      req.params.boardId
    );
    res.json({ architecture });
  })
);

boardsRouter.post(
  '/:boardId/entities',
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = boardsService.upsertEntity(req.userId!, req.params.boardId, req.body);
    res.status(201).json(result);
  })
);

boardsRouter.put(
  '/:boardId/entities/:entityId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = boardsService.upsertEntity(req.userId!, req.params.boardId, {
      ...req.body,
      id: req.params.entityId,
    });
    res.json(result);
  })
);

boardsRouter.post(
  '/:boardId/connections',
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = boardsService.upsertConnection(
      req.userId!,
      req.params.boardId,
      req.body
    );
    res.status(201).json(result);
  })
);

boardsRouter.put(
  '/:boardId/connections/:connectionId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = boardsService.upsertConnection(req.userId!, req.params.boardId, {
      ...req.body,
      id: req.params.connectionId,
    });
    res.json(result);
  })
);

boardsRouter.get(
  '/:boardId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const board = boardsService.get(req.userId!, req.params.boardId);
    res.json({ board });
  })
);

boardsRouter.put(
  '/:boardId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const board = boardsService.save(req.userId!, req.params.boardId, req.body);
    res.json({ board });
  })
);

boardsRouter.patch(
  '/:boardId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const board = boardsService.rename(req.userId!, req.params.boardId, req.body);
    res.json({ board });
  })
);

boardsRouter.delete(
  '/:boardId',
  asyncHandler(async (req: AuthedRequest, res) => {
    boardsService.remove(req.userId!, req.params.boardId);
    res.status(204).send();
  })
);
