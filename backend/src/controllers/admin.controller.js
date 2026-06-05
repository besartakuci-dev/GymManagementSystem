import {
  getDashboardData,
  getClassBookingsData,
} from '../services/admin.service.js';

import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const dashboardController = asyncHandler(async (req, res) => {
  const data = await getDashboardData();
  sendSuccess(res, data);
});

export const classBookingsController = asyncHandler(async (req, res) => {
  const data = await getClassBookingsData();
  sendSuccess(res, { classBookings: data });
});