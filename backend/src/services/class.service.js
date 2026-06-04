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

const DAY_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function formatDateTime(value) {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return value.replace('T', ' ').slice(0, 19).padEnd(19, ':00');
  }

  return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
}

function parseDateTime(value) {
  return new Date(String(value).replace(' ', 'T'));
}

function deriveDayOfWeek(dateTime) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[parseDateTime(dateTime).getDay()];
}

function deriveStartTime(dateTime) {
  const date = parseDateTime(dateTime);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function scheduleToStartDateTime(dayOfWeek, startTimeValue) {
  const targetDay = DAY_INDEX[dayOfWeek.toLowerCase()];
  const [hours, minutes] = startTimeValue.split(':').map(Number);
  const now = new Date();
  const result = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

  let daysUntil = (targetDay - now.getDay() + 7) % 7;
  if (daysUntil === 0 && result <= now) daysUntil = 7;
  result.setDate(result.getDate() + daysUntil);

  return formatDateTime(result.toISOString());
}

function preserveDuration(existingStart, existingEnd, nextStart) {
  const durationMs = parseDateTime(existingEnd).getTime() - parseDateTime(existingStart).getTime();
  const nextEnd = new Date(parseDateTime(nextStart).getTime() + durationMs);
  return formatDateTime(nextEnd.toISOString());
}

function defaultEndDateTime(startDateTime, existing = null) {
  if (existing) {
    return preserveDuration(existing.StartDateTime, existing.EndDateTime, startDateTime);
  }

  const end = parseDateTime(startDateTime);
  end.setHours(end.getHours() + 1);
  return formatDateTime(end.toISOString());
}

function resolveDateTimes(payload, existing = null) {
  const hasSchedule = payload.dayOfWeek !== undefined || payload.startTime !== undefined;

  if (hasSchedule) {
    if (!existing && !(payload.dayOfWeek && payload.startTime)) {
      throw new ApiError(400, 'Both dayOfWeek and startTime are required', 'INVALID_SCHEDULE');
    }

    const dayOfWeek = payload.dayOfWeek ?? deriveDayOfWeek(existing.StartDateTime);
    const startTimeValue = payload.startTime ?? deriveStartTime(existing.StartDateTime);
    const startDateTime = scheduleToStartDateTime(dayOfWeek, startTimeValue);
    const endDateTime = defaultEndDateTime(startDateTime, existing);

    return { startDateTime, endDateTime };
  }

  return {
    startDateTime: payload.startDateTime ? formatDateTime(payload.startDateTime) : undefined,
    endDateTime: payload.endDateTime ? formatDateTime(payload.endDateTime) : undefined,
  };
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

<<<<<<< HEAD
export async function getClassesDashboard() {
  return await getDashboardClasses();
}

export async function getClassBookings(classId) {
  return await getBookingsByClassId(classId);
=======
function assertValidClassTimes(startDateTime, endDateTime) {
  if (new Date(endDateTime) <= new Date(startDateTime)) {
    throw new ApiError(400, 'End date/time must be after start date/time', 'INVALID_CLASS_TIME');
  }
}

async function resolveTrainerIdForCreate(user, payload) {
  if (user.role === 'admin') {
    if (!payload.trainerId) throw new ApiError(400, 'Trainer is required', 'TRAINER_REQUIRED');
    return payload.trainerId;
  }

  const trainer = await requireTrainerProfile(user.userId);
  if (payload.trainerId !== undefined && payload.trainerId !== trainer.TrainerID) {
    throw new ApiError(403, 'Trainers can only create classes assigned to themselves', 'FORBIDDEN');
  }

  return trainer.TrainerID;
}

function resolveTrainerIdForUpdate(user, payload, existing) {
  if (user.role === 'admin') return payload.trainerId;

  if (payload.trainerId !== undefined && payload.trainerId !== existing.TrainerID) {
    throw new ApiError(403, 'Trainers cannot reassign classes', 'FORBIDDEN');
  }

  return undefined;
>>>>>>> dc8a9c61aec2eee78ed4343155a763680f3c29b1
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
  const trainerId = await resolveTrainerIdForCreate(user, payload);
  await validateReferences({ classTypeId: payload.classTypeId, trainerId });

  const { startDateTime, endDateTime } = resolveDateTimes(payload);
  assertValidClassTimes(startDateTime, endDateTime);

  const classId = await create({
    classTypeId: payload.classTypeId,
    trainerId,
    startDateTime,
    endDateTime,
    maxCapacity: payload.maxCapacity,
    status: payload.status,
  });

  return findById(classId);
}

export async function updateClass(user, classId, payload) {
  const existing = await requireClass(classId);
  assertCanManage(user, existing);

<<<<<<< HEAD
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
=======
  const { startDateTime, endDateTime } = resolveDateTimes(payload, existing);
  const nextStart = startDateTime ?? existing.StartDateTime;
  const nextEnd = endDateTime ?? existing.EndDateTime;
  assertValidClassTimes(nextStart, nextEnd);
>>>>>>> dc8a9c61aec2eee78ed4343155a763680f3c29b1

  const trainerId = resolveTrainerIdForUpdate(user, payload, existing);
  await validateReferences({ classTypeId: payload.classTypeId, trainerId });

  await update(classId, {
    classTypeId: payload.classTypeId,
    trainerId,
    startDateTime,
    endDateTime,
    maxCapacity: payload.maxCapacity,
    status: payload.status,
  });

  return findById(classId);
}

export async function cancelClass(user, classId) {
  const existing = await requireClass(classId);
  assertCanManage(user, existing);
  await updateStatus(classId, 'cancelled');
  return findById(classId);
}