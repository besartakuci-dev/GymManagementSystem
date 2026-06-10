import {
  findPublicTrainers,
  findTrainerByUserId,
  updateTrainerProfileByUserId,
  findClassesByTrainerUserId,
  findBookingsForTrainerClass,
} from '../models/trainer.model.js';

import { ApiError } from '../utils/ApiError.js';

async function requireTrainer(userId) {
  const trainer = await findTrainerByUserId(userId);

  if (!trainer) {
    throw new ApiError(404, 'Trainer profile not found', 'TRAINER_NOT_FOUND');
  }

  return trainer;
}

export async function getPublicTrainers() {
  return await findPublicTrainers();
}

export async function getMyTrainerProfile(userId) {
  return await requireTrainer(userId);
}

export async function updateMyTrainerProfile(userId, payload) {
  await requireTrainer(userId);

  await updateTrainerProfileByUserId(userId, {
    specialization: payload.specialization,
    bio: payload.bio,
  });

  return await requireTrainer(userId);
}

export async function getMyTrainerClasses(userId) {
  await requireTrainer(userId);
  return await findClassesByTrainerUserId(userId);
}

export async function getTrainerClassBookings(userId, classId) {
  await requireTrainer(userId);

  const bookings = await findBookingsForTrainerClass(userId, classId);

  if (!bookings) {
    throw new ApiError(403, 'You can only access bookings for your own classes', 'FORBIDDEN');
  }

  return bookings;
}