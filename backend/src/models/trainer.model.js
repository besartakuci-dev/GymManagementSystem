import { pool } from '../config/db.js';

export async function findPublicTrainers() {
  const [rows] = await pool.execute(`
    SELECT
      t.TrainerID,
      u.UserID,
      u.FirstName,
      u.LastName,
      u.Email,
      t.Specialization,
      t.Bio
    FROM Trainers t
    JOIN Users u ON u.UserID = t.UserID
    WHERE u.IsActive = TRUE
    ORDER BY u.FirstName ASC, u.LastName ASC
  `);

  return rows;
}

export async function findTrainerByUserId(userId) {
  const [rows] = await pool.execute(
    `
    SELECT
      t.TrainerID,
      t.UserID,
      u.FirstName,
      u.LastName,
      u.Email,
      t.Specialization,
      t.HireDate,
      t.Salary,
      t.Bio
    FROM Trainers t
    JOIN Users u ON u.UserID = t.UserID
    WHERE t.UserID = ?
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] ?? null;
}

export async function updateTrainerProfileByUserId(userId, { specialization, bio }) {
  const updates = [];
  const values = [];

  if (specialization !== undefined) {
    updates.push('Specialization = ?');
    values.push(specialization);
  }

  if (bio !== undefined) {
    updates.push('Bio = ?');
    values.push(bio);
  }

  if (!updates.length) return 0;

  values.push(userId);

  const [result] = await pool.execute(
    `UPDATE Trainers SET ${updates.join(', ')} WHERE UserID = ?`,
    values
  );

  return result.affectedRows;
}

export async function findClassesByTrainerUserId(userId) {
  const [rows] = await pool.execute(
    `
    SELECT
      c.ClassID,
      c.Name AS ClassName,
      ct.TypeName AS ClassType,
      ct.Category,
      c.StartDateTime,
      c.EndDateTime,
      c.MaxCapacity,
      c.Room,
      c.Status,
      COUNT(CASE WHEN b.Status = 'booked' THEN b.BookingID END) AS BookedUsers
    FROM Classes c
    JOIN Trainers t ON t.TrainerID = c.TrainerID
    JOIN Class_Types ct ON ct.ClassTypeID = c.ClassTypeID
    LEFT JOIN Bookings b ON b.ClassID = c.ClassID
    WHERE t.UserID = ?
    GROUP BY
      c.ClassID,
      c.Name,
      ct.TypeName,
      ct.Category,
      c.StartDateTime,
      c.EndDateTime,
      c.MaxCapacity,
      c.Room,
      c.Status
    ORDER BY c.StartDateTime ASC
    `,
    [userId]
  );

  return rows;
}

export async function findBookingsForTrainerClass(userId, classId) {
  const [classRows] = await pool.execute(
    `
    SELECT c.ClassID
    FROM Classes c
    JOIN Trainers t ON t.TrainerID = c.TrainerID
    WHERE c.ClassID = ? AND t.UserID = ?
    LIMIT 1
    `,
    [classId, userId]
  );

  if (!classRows[0]) return null;

  const [rows] = await pool.execute(
    `
    SELECT
      b.BookingID,
      b.ClassID,
      b.UserID,
      u.FirstName,
      u.LastName,
      u.Email,
      b.BookingDate,
      b.Status,
      b.PaymentStatus
    FROM Bookings b
    JOIN Users u ON u.UserID = b.UserID
    WHERE b.ClassID = ?
    ORDER BY b.BookingDate DESC
    `,
    [classId]
  );

  return rows;
}