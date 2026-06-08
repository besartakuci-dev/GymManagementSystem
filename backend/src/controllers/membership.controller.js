import {
  cancelMembership,
  getMyMembership,
  listPlans,
  purchaseMembership,
} from '../services/membership.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listPlansController = asyncHandler(async (req, res) => {
  const plans = await listPlans();
  sendSuccess(res, { plans });
});

export const myMembershipController = asyncHandler(async (req, res) => {
  const { memberships, active } = await getMyMembership(req.user.userId);
  sendSuccess(res, { memberships, active });
});

export const purchaseMembershipController = asyncHandler(async (req, res) => {
  const membership = await purchaseMembership(req.user.userId, req.validated.body);
  sendSuccess(res, { membership }, 'Membership activated', 201);
});

export const cancelMembershipController = asyncHandler(async (req, res) => {
  const membership = await cancelMembership(req.user, req.validated.params.id);
  sendSuccess(res, { membership }, 'Membership cancelled');
});
