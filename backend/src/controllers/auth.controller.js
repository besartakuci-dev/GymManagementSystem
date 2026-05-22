import { register, login, getProfile } from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const registerController = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, dateOfBirth } = req.validated.body;
  const { token, user } = await register({ email, password, firstName, lastName, phone, dateOfBirth });
  sendSuccess(res, { token, user }, 'Registration successful', 201);
});

export const loginController = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const { token, user } = await login({ email, password });
  sendSuccess(res, { token, user }, 'Login successful');
});

export const meController = asyncHandler(async (req, res) => {
  const user = await getProfile(req.user.userId);
  sendSuccess(res, { user });
});
