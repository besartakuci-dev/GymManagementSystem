import {
  getClassesDashboard,
  getClassBookings
} from '../services/class.service.js';

import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardController = asyncHandler(async (req, res) => {
  const classes = await getClassesDashboard();

  sendSuccess(res, { classes });
});

export const classBookingsController = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bookings = await getClassBookings(id);

  sendSuccess(res, { bookings });
});