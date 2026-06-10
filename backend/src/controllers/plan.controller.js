import { addPlan, editPlan, getPlan, listPlans, removePlan } from '../services/plan.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listPlansController = asyncHandler(async (req, res) => {
  // Public storefront sees active plans only; an admin may opt into inactive ones.
  const isAdmin = req.user?.role === 'admin';
  const includeInactive = isAdmin && req.validated.query.includeInactive === true;
  const plans = await listPlans({ includeInactive });
  sendSuccess(res, { plans });
});

export const getPlanController = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const plan = await getPlan(req.validated.params.id, { includeInactive: isAdmin });
  sendSuccess(res, { plan });
});

export const createPlanController = asyncHandler(async (req, res) => {
  const plan = await addPlan(req.validated.body);
  sendSuccess(res, { plan }, 'Plan created successfully', 201);
});

export const updatePlanController = asyncHandler(async (req, res) => {
  const plan = await editPlan(req.validated.params.id, req.validated.body);
  sendSuccess(res, { plan }, 'Plan updated successfully');
});

export const deletePlanController = asyncHandler(async (req, res) => {
  const plan = await removePlan(req.validated.params.id);
  sendSuccess(res, { plan }, 'Plan deactivated successfully');
});
