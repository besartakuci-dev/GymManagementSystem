import { getClassesDashboard } from '../services/class.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardController = asyncHandler(async (req, res) => {
  const classes = await getClassesDashboard();

  sendSuccess(res, { classes });
});