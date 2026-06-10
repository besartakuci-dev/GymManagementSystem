import { pool } from '../config/db.js';

// NOTE: plan catalog SQL (findAllPlans / findPlanById / create / update / soft-delete)
// lives in models/plan.model.js — the single source of truth for the Plans resource.

export async function findAllMembershipsByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT
       m.MembershipID,
       m.PlanID,
       p.PlanName,
       p.IncludesClasses,
       p.DurationMonths,
       m.StartDate,
       m.EndDate,
       m.Status,
       m.Amount,
       m.PaymentMethod,
       m.PaymentStatus,
       m.PaidAt,
       m.CreatedAt
     FROM Memberships m
     JOIN Membership_Plans p ON p.PlanID = m.PlanID
     WHERE m.UserID = ?
     ORDER BY m.CreatedAt DESC, m.MembershipID DESC`,
    [userId]
  );

  return rows;
}

export async function findMembershipById(membershipId) {
  const [rows] = await pool.execute(
    `SELECT
       m.MembershipID,
       m.UserID,
       m.PlanID,
       p.PlanName,
       p.IncludesClasses,
       p.DurationMonths,
       m.StartDate,
       m.EndDate,
       m.Status,
       m.Amount,
       m.PaymentMethod,
       m.PaymentStatus,
       m.PaidAt,
       m.CreatedAt
     FROM Memberships m
     JOIN Membership_Plans p ON p.PlanID = m.PlanID
     WHERE m.MembershipID = ?
     LIMIT 1`,
    [membershipId]
  );

  return rows[0] ?? null;
}

export async function updateMembershipStatus(membershipId, status) {
  await pool.execute(
    `UPDATE Memberships SET Status = ? WHERE MembershipID = ?`,
    [status, membershipId]
  );
}

export async function findActiveMembershipByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT
       m.MembershipID,
       m.PlanID,
       p.PlanName,
       p.IncludesClasses,
       m.StartDate,
       m.EndDate,
       m.Status,
       m.Amount
     FROM Memberships m
     JOIN Membership_Plans p ON p.PlanID = m.PlanID
     WHERE m.UserID = ? AND m.Status = 'active' AND m.EndDate >= CURDATE()
     ORDER BY m.EndDate DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0] ?? null;
}

export async function hasActiveMembership(userId) {
  return Boolean(await findActiveMembershipByUser(userId));
}

export async function createMembership({ userId, planId, durationMonths, amount, paymentMethod }) {
  const [result] = await pool.execute(
    `INSERT INTO Memberships
       (UserID, PlanID, StartDate, EndDate, Status, Amount, PaymentMethod, PaymentStatus, PaidAt)
     VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? MONTH), 'active', ?, ?, 'paid', NOW())`,
    [userId, planId, durationMonths, amount, paymentMethod]
  );

  return result.insertId;
}
