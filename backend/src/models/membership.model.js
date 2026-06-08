import { pool } from '../config/db.js';

export async function findAllPlans() {
  const [rows] = await pool.execute(
    `SELECT PlanID, PlanName, DurationMonths, Price, IncludesClasses, Description
     FROM Membership_Plans
     ORDER BY Price ASC`
  );

  return rows;
}

export async function findPlanById(planId) {
  const [rows] = await pool.execute(
    `SELECT PlanID, PlanName, DurationMonths, Price, IncludesClasses, Description
     FROM Membership_Plans
     WHERE PlanID = ?
     LIMIT 1`,
    [planId]
  );

  return rows[0] ?? null;
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
