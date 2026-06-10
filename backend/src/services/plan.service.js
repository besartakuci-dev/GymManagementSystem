import {
  createPlan,
  findAllPlans,
  findPlanById,
  softDeletePlan,
  updatePlan,
} from '../models/plan.model.js';
import { ApiError } from '../utils/ApiError.js';

async function requirePlan(planId, { includeInactive = true } = {}) {
  const plan = await findPlanById(planId);
  // Hide soft-deleted plans from non-admin callers (they read with includeInactive=false).
  if (!plan || (!includeInactive && !plan.IsActive)) {
    throw new ApiError(404, 'Plan not found', 'PLAN_NOT_FOUND');
  }
  return plan;
}

export async function listPlans({ includeInactive = false } = {}) {
  return findAllPlans({ includeInactive });
}

export async function getPlan(planId, { includeInactive = false } = {}) {
  return requirePlan(planId, { includeInactive });
}

export async function addPlan(payload) {
  const planId = await createPlan(payload);
  return findPlanById(planId);
}

export async function editPlan(planId, payload) {
  // Admin-only path: an admin may edit an inactive plan too.
  await requirePlan(planId, { includeInactive: true });
  await updatePlan(planId, payload);
  return findPlanById(planId);
}

export async function removePlan(planId) {
  await requirePlan(planId, { includeInactive: true });
  await softDeletePlan(planId);
  return findPlanById(planId);
}
