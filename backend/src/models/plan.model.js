import { pool } from '../config/db.js';

// One column list so list/get always return the same plan shape. The first six
// columns are the original contract the frontend already consumes; the rest are
// the storefront fields added by the 001 migration.
const PLAN_COLUMNS = `
  PlanID, PlanName, DurationMonths, Price, IncludesClasses, Description,
  Features, IsActive, IsPopular, SortOrder, CreatedAt, UpdatedAt
`;

// Normalise the JSON `Features` column to a real array. mysql2 returns JSON columns
// as a string over the prepared-statement (execute) path, so parse it ourselves and
// always hand callers an array (never a string or null).
function mapPlanRow(row) {
  if (!row) return row;
  if (typeof row.Features === 'string') {
    try {
      row.Features = JSON.parse(row.Features);
    } catch {
      row.Features = [];
    }
  } else if (row.Features == null) {
    row.Features = [];
  }
  return row;
}

export async function findAllPlans({ includeInactive = false } = {}) {
  const where = includeInactive ? '' : 'WHERE IsActive = TRUE';
  const [rows] = await pool.execute(
    `SELECT ${PLAN_COLUMNS}
     FROM Membership_Plans
     ${where}
     ORDER BY SortOrder ASC, Price ASC`
  );

  return rows.map(mapPlanRow);
}

export async function findPlanById(planId) {
  const [rows] = await pool.execute(
    `SELECT ${PLAN_COLUMNS}
     FROM Membership_Plans
     WHERE PlanID = ?
     LIMIT 1`,
    [planId]
  );

  return mapPlanRow(rows[0] ?? null);
}

export async function createPlan({
  name,
  price,
  durationMonths,
  description,
  features,
  includesClasses,
  isPopular,
  isActive,
  sortOrder,
}) {
  const [result] = await pool.execute(
    `INSERT INTO Membership_Plans
       (PlanName, DurationMonths, Price, IncludesClasses, Description, Features, IsActive, IsPopular, SortOrder)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      durationMonths ?? 1,
      price,
      includesClasses ?? false,
      description ?? null,
      JSON.stringify(features ?? []),
      isActive ?? true,
      isPopular ?? false,
      sortOrder ?? 0,
    ]
  );

  return result.insertId;
}

export async function updatePlan(planId, fields) {
  const columnMap = {
    name: 'PlanName',
    durationMonths: 'DurationMonths',
    price: 'Price',
    includesClasses: 'IncludesClasses',
    description: 'Description',
    isActive: 'IsActive',
    isPopular: 'IsPopular',
    sortOrder: 'SortOrder',
  };

  // Build the SET list from provided scalar fields only (mirrors class/classType update).
  const entries = Object.entries(fields).filter(
    ([key, value]) => value !== undefined && key in columnMap
  );
  const assignments = entries.map(([key]) => `${columnMap[key]} = ?`);
  const values = entries.map(([, value]) => value);

  // Features is JSON — stringify it separately when present.
  if (fields.features !== undefined) {
    assignments.push('Features = ?');
    values.push(JSON.stringify(fields.features));
  }

  if (!assignments.length) return 0;

  const [result] = await pool.execute(
    `UPDATE Membership_Plans SET ${assignments.join(', ')} WHERE PlanID = ?`,
    [...values, planId]
  );

  return result.affectedRows;
}

// Soft delete — the Memberships FK is ON DELETE RESTRICT, so plans are retired by
// flag (IsActive=false), never row-deleted. Mirrors deactivateClassType.
export async function softDeletePlan(planId) {
  const [result] = await pool.execute(
    `UPDATE Membership_Plans SET IsActive = FALSE WHERE PlanID = ?`,
    [planId]
  );

  return result.affectedRows;
}
