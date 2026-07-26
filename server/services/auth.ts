import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { AppError } from '../errors.js';
import { boardsRepo } from '../repositories/boards.js';
import { sessionsRepo } from '../repositories/sessions.js';
import { usersRepo } from '../repositories/users.js';
import { userSettingsRepo } from '../repositories/userSettings.js';
import { toPublicUser, type PublicUser } from '../types.js';

const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(80).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128),
});

export type AuthResult = {
  user: PublicUser;
  token: string;
  expiresAt: string;
};

export type JwtPayload = {
  sub: string;
  sid: string;
};

function parseJwtExpiryToIso(expiresIn: string): string {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  const now = Date.now();
  if (!match) {
    return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const mult =
    unit === 's'
      ? 1000
      : unit === 'm'
        ? 60_000
        : unit === 'h'
          ? 3_600_000
          : 86_400_000;
  return new Date(now + amount * mult).toISOString();
}

function signToken(userId: string, sessionId: string): string {
  return jwt.sign({ sub: userId, sid: sessionId } satisfies JwtPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export const authService = {
  async register(input: unknown): Promise<AuthResult> {
    const data = registerSchema.parse(input);
    const existing = usersRepo.findByEmail(data.email);
    if (existing) {
      throw new AppError(409, 'Email already registered', 'EMAIL_TAKEN');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const displayName =
      data.displayName?.trim() || data.email.split('@')[0] || 'User';

    const user = usersRepo.create({
      email: data.email,
      passwordHash,
      displayName,
    });

    boardsRepo.create({
      userId: user.id,
      name: 'My First Canvas',
    });
    userSettingsRepo.upsert(user.id, {
      lastBoardId: null,
      locale: 'en',
    });

    return this.issueSession(user.id);
  },

  async login(input: unknown): Promise<AuthResult> {
    const data = loginSchema.parse(input);
    const user = usersRepo.findByEmail(data.email);
    if (!user) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const ok = await bcrypt.compare(data.password, user.password_hash);
    if (!ok) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    return this.issueSession(user.id);
  },

  issueSession(userId: string): AuthResult {
    const user = usersRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const sessionId = randomUUID();
    const expiresAt = parseJwtExpiryToIso(config.jwtExpiresIn);
    const token = signToken(userId, sessionId);

    sessionsRepo.create({
      id: sessionId,
      userId,
      token,
      expiresAt,
    });

    return {
      user: toPublicUser(user),
      token,
      expiresAt,
    };
  },

  logout(token: string): void {
    const session = sessionsRepo.findValidByToken(token);
    if (session) {
      sessionsRepo.revoke(session.id);
    }
  },

  me(userId: string): PublicUser {
    const user = usersRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    return toPublicUser(user);
  },

  verifyAccessToken(token: string): JwtPayload {
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    } catch {
      throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');
    }

    const sub = payload.sub;
    const sid = payload.sid;
    if (typeof sub !== 'string' || typeof sid !== 'string') {
      throw new AppError(401, 'Invalid token payload', 'INVALID_TOKEN');
    }

    const session = sessionsRepo.findValidById(sid);
    if (!session || session.user_id !== sub) {
      throw new AppError(401, 'Session revoked or expired', 'SESSION_INVALID');
    }

    return { sub, sid };
  },
};
