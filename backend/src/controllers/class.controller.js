import {
  cancelClass,
  createClass,
  getClassesDashboard,
  getClassBookings,
  getClass,
  joinClass,
  listClasses,
  listMyBookings,
  listTrainerClasses,
  updateClass,
} from '../services/class.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

function toDate(value) {
  if (value instanceof Date) return value;
  return new Date(String(value).replace(' ', 'T'));
}

function datePart(value) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timePart(value) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function withSchedule(gymClass) {
  if (!gymClass) return gymClass;
  const status = gymClass.Status === 'scheduled' ? 'Active' : gymClass.Status === 'cancelled' ? 'Cancelled' : 'Completed';

  return {
    ...gymClass,
    id: gymClass.ClassID,
    name: gymClass.Name ?? gymClass.ClassTypeName,
    category: gymClass.Category,
    date: datePart(gymClass.StartDateTime),
    dayOfWeek: gymClass.dayOfWeek,
    startTime: gymClass.startTime ?? timePart(gymClass.StartDateTime),
    endTime: gymClass.endTime ?? timePart(gymClass.EndDateTime),
    room: gymClass.Room,
    maxCapacity: gymClass.MaxCapacity,
    bookedCount: Number(gymClass.BookedCount ?? 0),
    spotsLeft: Number(gymClass.SpotsLeft ?? 0),
    trainerId: gymClass.TrainerID,
    trainerName: gymClass.TrainerName,
    status,
  };
}

export const dashboardController = asyncHandler(async (req, res) => {
  const classes = await getClassesDashboard();

  sendSuccess(res, { classes });
});

export const classBookingsController = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bookings = await getClassBookings(id);

  sendSuccess(res, { bookings });
});

export const myBookingsController = asyncHandler(async (req, res) => {
  const bookings = await listMyBookings(req.user);
  sendSuccess(res, { bookings });
});

export const listClassesController = asyncHandler(async (req, res) => {
  const data = await listClasses(req.user);
  sendSuccess(res, {
    ...data,
    classes: data.classes.map(withSchedule),
  });
});

export const getClassController = asyncHandler(async (req, res) => {
  const gymClass = await getClass(req.validated.params.id);
  sendSuccess(res, { class: withSchedule(gymClass) });
});

export const listTrainerClassesController = asyncHandler(async (req, res) => {
  const classes = await listTrainerClasses(req.user, req.validated.params.trainerId);
  sendSuccess(res, { classes: classes.map(withSchedule) });
});

export const createClassController = asyncHandler(async (req, res) => {
  const gymClass = await createClass(req.user, req.validated.body);
  sendSuccess(res, { class: withSchedule(gymClass) }, 'Class created successfully', 201);
});

export const updateClassController = asyncHandler(async (req, res) => {
  const gymClass = await updateClass(req.user, req.validated.params.id, req.validated.body);
  sendSuccess(res, { class: withSchedule(gymClass) }, 'Class updated successfully');
});

export const cancelClassController = asyncHandler(async (req, res) => {
  const gymClass = await cancelClass(req.user, req.validated.params.id);
  sendSuccess(res, { class: withSchedule(gymClass) }, 'Class cancelled successfully');
});

export const joinClassController = asyncHandler(async (req, res) => {
  const data = await joinClass(req.user, req.validated.params.id, req.validated.body);
  sendSuccess(res, { ...data, class: withSchedule(data.class) }, 'Class booked successfully', 201);
});
