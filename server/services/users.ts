import { z } from 'zod';
import { AppError } from '../errors.js';
import { usersRepo } from '../repositories/users.js';
import { userSettingsRepo } from '../repositories/userSettings.js';
import { toPublicUser, type PublicUser } from '../types.js';

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const usersService = {
  getProfile(userId: string): {
    user: PublicUser;
    settings: Record<string, unknown>;
  } {
    const user = usersRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    return {
      user: toPublicUser(user),
      settings: userSettingsRepo.get(userId),
    };
  },

  updateProfile(userId: string, input: unknown) {
    const data = updateProfileSchema.parse(input ?? {});
    let user = usersRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    if (data.displayName) {
      user = usersRepo.updateDisplayName(userId, data.displayName) ?? user;
    }

    const settings = data.settings
      ? userSettingsRepo.upsert(userId, data.settings)
      : userSettingsRepo.get(userId);

    return {
      user: toPublicUser(user),
      settings,
    };
  },
};
