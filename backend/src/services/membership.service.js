import {
  createMembership,
  findActiveMembershipByUser,
  findAllMembershipsByUser,
  findMembershipById,
  updateMembershipStatus,
} from '../models/membership.model.js';
import { findPlanById } from '../models/plan.model.js';
import { ApiError } from '../utils/ApiError.js';

export async function getMyMembership(userId) {
  const [memberships, active] = await Promise.all([
    findAllMembershipsByUser(userId),
    findActiveMembershipByUser(userId),
  ]);

  return { memberships, active };
}

export async function purchaseMembership(userId, { planId, paymentMethod }) {
  const plan = await findPlanById(planId);
  // A retired (soft-deleted) plan is not purchasable — treat it as not found.
  if (!plan || !plan.IsActive) throw new ApiError(404, 'Plan not found', 'PLAN_NOT_FOUND');

  // Demo / mock payment: no gateway, no card validation — it always succeeds.
  // We simply record a paid, active membership for the authenticated user.
  const membershipId = await createMembership({
    userId,
    planId,
    durationMonths: plan.DurationMonths,
    amount: plan.Price,
    paymentMethod,
  });

  return findMembershipById(membershipId);
}

export async function cancelMembership(user, membershipId) {
  const membership = await findMembershipById(membershipId);
  if (!membership) throw new ApiError(404, 'Membership not found', 'MEMBERSHIP_NOT_FOUND');

  // Ownership: a member may only cancel their own membership; admins may cancel any.
  if (user.role !== 'admin' && membership.UserID !== user.userId) {
    throw new ApiError(403, 'You can only cancel your own membership', 'FORBIDDEN');
  }

  if (membership.Status !== 'active') {
    throw new ApiError(409, 'Membership is not active', 'MEMBERSHIP_NOT_ACTIVE');
  }

  // Soft cancel — mirror PUT /classes/:id/cancel. No refund (payments are not real).
  await updateMembershipStatus(membershipId, 'cancelled');
  return findMembershipById(membershipId);
}
