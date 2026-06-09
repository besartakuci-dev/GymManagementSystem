import {
  getDashboardData,
  getClassBookingsData,
  getAllUsers,
  createAdminUser,
  setUserActiveStatus,
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

export const getUsersController = asyncHandler(async (req, res) => {
  const users = await getAllUsers();
  sendSuccess(res, { users });
});

export const createUserController = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, dateOfBirth, role } = req.body;
  const user = await createAdminUser({ email, password, firstName, lastName, phone, dateOfBirth, role });
  sendSuccess(res, { user }, 'User created successfully', 201);
});

export const setUserActiveController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const user = await setUserActiveStatus(Number(id), Boolean(isActive));
  sendSuccess(res, { user }, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
});