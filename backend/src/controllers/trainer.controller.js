import {
  getPublicTrainers,
  getMyTrainerProfile,
  updateMyTrainerProfile,
  getMyTrainerClasses,
  getTrainerClassBookings,
} from '../services/trainer.service.js';

import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getPublicTrainersController = asyncHandler(async (req, res) => {
  const trainers = await getPublicTrainers();
  sendSuccess(res, { trainers });
});

export const getMyTrainerProfileController = asyncHandler(async (req, res) => {
  const profile = await getMyTrainerProfile(req.user.userId);
  sendSuccess(res, { profile });
});

export const updateMyTrainerProfileController = asyncHandler(async (req, res) => {
  const profile = await updateMyTrainerProfile(req.user.userId, req.body);
  sendSuccess(res, { profile }, 'Trainer profile updated successfully');
});

export const getMyTrainerClassesController = asyncHandler(async (req, res) => {
  const classes = await getMyTrainerClasses(req.user.userId);
  sendSuccess(res, { classes });
});

export const getTrainerClassBookingsController = asyncHandler(async (req, res) => {
  const bookings = await getTrainerClassBookings(req.user.userId, req.params.id);
  sendSuccess(res, { bookings });
});