import {
  getDashboardClasses,
  getBookingsByClassId,
  classTypeExists,
  create,
  findActiveTrainers,
  findAll,
  findById,
  findByTrainer,
  findClassTypes,
  findTrainerByUserId,
  trainerExists,
  update,
  updateStatus,
} from '../models/class.model.js';

import { ApiError } from '../utils/ApiError.js';

function formatDateTime(value) {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return value.replace('T', ' ').slice(0, 19).padEnd(19, ':00');
  }

  return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
}

async function requireClass(classId) {
  const existing = await findById(classId);
  if (!existing) throw new ApiError(404, 'Class not found', 'CLASS_NOT_FOUND');
  return existing;
}

async function requireTrainerProfile(userId) {
  const trainer = await findTrainerByUserId(userId);
  if (!trainer) throw new ApiError(403, 'Trainer profile not found', 'TRAINER_PROFILE_NOT_FOUND');
  return trainer;
}

function assertCanManage(user, classRow) {
  if (user.role === 'admin') return;
  if (user.role === 'trainer' && classRow.TrainerUserID === user.userId) return;
  throw new ApiError(403, 'You can only manage your own classes', 'FORBIDDEN');
}

async function validateReferences({ classTypeId, trainerId }) {
  if (classTypeId !== undefined && !(await classTypeExists(classTypeId))) {
    throw new ApiError(400, 'Class type does not exist', 'CLASS_TYPE_NOT_FOUND');
  }

  if (trainerId !== undefined && !(await trainerExists(trainerId))) {
    throw new ApiError(400, 'Trainer does not exist', 'TRAINER_NOT_FOUND');
  }
}

export async function getClassesDashboard() {
  return await getDashboardClasses();
}

export async function getClassBookings(classId) {
  return await getBookingsByClassId(classId);
}

export async function listClasses() {
  const [classes, classTypes, trainers] = await Promise.all([
    findAll({ upcomingOnly: true }),
    findClassTypes(),
    findActiveTrainers(),
  ]);

  return { classes, classTypes, trainers };
}

export async function getClass(classId) {
  return requireClass(classId);
}

export async function listTrainerClasses(userId) {
  const trainer = await requireTrainerProfile(userId);
  return findByTrainer(trainer.TrainerID);
}

export async function createClass(user, payload) {
  const trainerId =
    user.role === 'admin' ? payload.trainerId : (await requireTrainerProfile(user.userId)).TrainerID;

  if (!trainerId) throw new ApiError(400, 'Trainer is required', 'TRAINER_REQUIRED');

  await validateReferences({ classTypeId: payload.classTypeId, trainerId });

  const classId = await create({
    ...payload,
    trainerId,
    startDateTime: formatDateTime(payload.startDateTime),
    endDateTime: formatDateTime(payload.endDateTime),
  });

  return findById(classId);
}

export async function updateClass(user, classId, payload) {
  const existing = await requireClass(classId);
  assertCanManage(user, existing);

  const nextStart = payload.startDateTime ?? existing.StartDateTime;
  const nextEnd = payload.endDateTime ?? existing.EndDateTime;

  if (new Date(nextEnd) <= new Date(nextStart)) {
    throw new ApiError(400, 'End date/time must be after start date/time', 'INVALID_CLASS_TIME');
  }

  const trainerId =
    user.role === 'admin'
      ? payload.trainerId
      : payload.trainerId === undefined
        ? undefined
        : existing.TrainerID;

  await validateReferences({ classTypeId: payload.classTypeId, trainerId });

  await update(classId, {
    ...payload,
    trainerId,
    startDateTime: payload.startDateTime ? formatDateTime(payload.startDateTime) : undefined,
    endDateTime: payload.endDateTime ? formatDateTime(payload.endDateTime) : undefined,
  });

  return findById(classId);
}

export async function cancelClass(user, classId) {
  const existing = await requireClass(classId);
  assertCanManage(user, existing);
  await updateStatus(classId, 'cancelled');
  return findById(classId);
}