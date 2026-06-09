import {
  getDashboardClasses,
  getBookingsByClassId,
  classTypeExists,
  create,
  createBooking,
  findActiveTrainers,
  findAll,
  findBookedClassIdsByUser,
  findBookingById,
  findBookingByUserAndClass,
  findBookingsByUser,
  findById,
  findByTrainer,
  findClassTypeByName,
  findClassTypes,
  findTrainerByUserId,
  trainerExists,
  remove,
  update,
  updateStatus,
} from '../models/class.model.js';

import { hasActiveMembership } from '../models/membership.model.js';
import { ApiError } from '../utils/ApiError.js';

function buildDateTime(date, time) {
  return `${date} ${time}:00`;
}

function resolveDateTimes(payload) {
  return {
    startDateTime: buildDateTime(payload.date, payload.startTime),
    endDateTime: buildDateTime(payload.date, payload.endTime),
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

async function resolveClassType(category) {
  const classType = await findClassTypeByName(category);
  if (!classType) {
    throw new ApiError(400, 'Class type does not exist', 'CLASS_TYPE_NOT_FOUND');
  }

  return classType;
}

async function validateClassTypeId(classTypeId) {
  if (!(await classTypeExists(classTypeId))) {
    throw new ApiError(400, 'Class type does not exist', 'CLASS_TYPE_NOT_FOUND');
  }
}

async function assertTrainerExists(trainerId) {
  if (!(await trainerExists(trainerId))) {
    throw new ApiError(400, 'Trainer does not exist', 'TRAINER_NOT_FOUND');
  }
}

export async function getClassesDashboard() {
  return await getDashboardClasses();
}

export async function getClassBookings(classId) {
  return await getBookingsByClassId(classId);
}

export async function listMyBookings(user) {
  return findBookingsByUser(user.userId);
}

function assertValidClassTimes(startDateTime, endDateTime) {
  if (new Date(endDateTime) <= new Date(startDateTime)) {
    throw new ApiError(400, 'End date/time must be after start date/time', 'INVALID_CLASS_TIME');
  }
}

function assertCanChangeCapacity(payload, existing) {
  if (payload.maxCapacity === undefined) return;
  if (Number(payload.maxCapacity) < Number(existing.BookedCount)) {
    throw new ApiError(
      400,
      'Capacity cannot be lower than the number of existing bookings',
      'CAPACITY_BELOW_BOOKINGS'
    );
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
}

export async function listClasses(user) {
  const isMember = user?.role === 'member';
  const isTrainer = user?.role === 'trainer';
  const trainer = isTrainer ? await requireTrainerProfile(user.userId) : null;
  const classesPromise = isTrainer
    ? findByTrainer(trainer.TrainerID)
    : findAll({ upcomingOnly: isMember, activeOnly: isMember });
  const [classes, classTypes, trainers] = await Promise.all([
    classesPromise,
    findClassTypes(),
    findActiveTrainers(),
  ]);

  if (isMember) {
    const bookedClassIds = new Set(await findBookedClassIdsByUser(user.userId));
    return {
      classes: classes.map((gymClass) => ({
        ...gymClass,
        IsBookedByCurrentUser: bookedClassIds.has(gymClass.ClassID),
      })),
      classTypes,
      trainers,
    };
  }

  return { classes, classTypes, trainers };
}

export async function getClass(classId) {
  return requireClass(classId);
}

export async function listTrainerClasses(user, trainerId) {
  await assertTrainerExists(trainerId);
  if (user.role === 'trainer') {
    const trainer = await requireTrainerProfile(user.userId);
    if (trainer.TrainerID !== trainerId) {
      throw new ApiError(403, 'You can only view your own classes', 'FORBIDDEN');
    }
  }

  return findByTrainer(trainerId);
}

export async function createClass(user, payload) {
  const trainerId = await resolveTrainerIdForCreate(user, payload);
  await assertTrainerExists(trainerId);
  const classType = await resolveClassType(payload.category);
  await validateClassTypeId(classType.ClassTypeID);

  const { startDateTime, endDateTime } = resolveDateTimes(payload);
  assertValidClassTimes(startDateTime, endDateTime);

  const classId = await create({
    name: payload.name,
    classTypeId: classType.ClassTypeID,
    trainerId,
    startDateTime,
    endDateTime,
    maxCapacity: payload.maxCapacity,
    price: classType.Price ?? 0,
    room: payload.room,
    status: 'scheduled',
  });

  return findById(classId);
}

export async function updateClass(user, classId, payload) {
  const existing = await requireClass(classId);
  assertCanManage(user, existing);
  if (existing.Status === 'cancelled') {
    throw new ApiError(400, 'Cancelled classes cannot be updated', 'CLASS_CANCELLED');
  }
  assertCanChangeCapacity(payload, existing);

  const classType = await resolveClassType(payload.category);
  const { startDateTime, endDateTime } = resolveDateTimes(payload);
  assertValidClassTimes(startDateTime, endDateTime);

  const trainerId = resolveTrainerIdForUpdate(user, payload, existing);
  if (trainerId !== undefined) await assertTrainerExists(trainerId);

  await update(classId, {
    name: payload.name,
    classTypeId: classType.ClassTypeID,
    trainerId,
    startDateTime,
    endDateTime,
    maxCapacity: payload.maxCapacity,
    price: classType.Price ?? existing.Price,
    room: payload.room,
  });

  return findById(classId);
}

export async function cancelClass(user, classId) {
  const existing = await requireClass(classId);
  assertCanManage(user, existing);
  await updateStatus(classId, 'cancelled');
  return findById(classId);
}

export async function deleteClass(user, classId) {
  const existing = await requireClass(classId);
  assertCanManage(user, existing);
  await remove(classId);
  return { id: Number(classId) };
}

export async function joinClass(user, classId, payload) {
  if (!(await hasActiveMembership(user.userId))) {
    throw new ApiError(403, 'An active membership is required to join classes', 'MEMBERSHIP_REQUIRED');
  }

  const existing = await requireClass(classId);

  if (existing.Status !== 'scheduled') {
    throw new ApiError(400, 'Only active classes can be joined', 'CLASS_NOT_AVAILABLE');
  }

  if (new Date(existing.StartDateTime) < new Date()) {
    throw new ApiError(400, 'Past classes cannot be joined', 'CLASS_ALREADY_STARTED');
  }

  if (Number(existing.BookedCount) >= Number(existing.MaxCapacity)) {
    throw new ApiError(400, 'Class is full', 'CLASS_FULL');
  }

  const existingBooking = await findBookingByUserAndClass(user.userId, classId);
  if (existingBooking) {
    throw new ApiError(409, 'You have already joined this class', 'CLASS_ALREADY_JOINED');
  }

  const bookingId = await createBooking({
    userId: user.userId,
    classId,
    amount: existing.Price,
    paymentMethod: payload.paymentMethod,
  });
  const [booking, gymClass] = await Promise.all([findBookingById(bookingId), findById(classId)]);
  return { booking, class: gymClass };
}
