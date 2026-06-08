import {
  createMembership,
  findActiveMembershipByUser,
  findAllPlans,
  findPlanById,
  hasActiveMembership,
} from '../models/membership.model.js';
import { ApiError } from '../utils/ApiError.js';

export async function listPlans() {
  return findAllPlans();
}

export async function getMyMembership(userId) {
  return findActiveMembershipByUser(userId);
}

export async function purchaseMembership(userId, { planId, paymentMethod }) {
  const plan = await findPlanById(planId);
  if (!plan) throw new ApiError(404, 'Plan not found', 'PLAN_NOT_FOUND');

  if (await hasActiveMembership(userId)) {
    throw new ApiError(409, 'You already have an active membership', 'ALREADY_MEMBER');
  }

  await createMembership({
    userId,
    planId,
    durationMonths: plan.DurationMonths,
    amount: plan.Price,
    paymentMethod,
  });

  return findActiveMembershipByUser(userId);
}
