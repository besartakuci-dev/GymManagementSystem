import { pool } from '../config/db.js';

export async function getDashboardClasses() {
  const [rows] = await pool.execute(`
    SELECT
      c.ClassID,
      c.Name AS ClassName,
      c.StartDateTime,
      c.EndDateTime,
      c.MaxCapacity,
      c.Room,
      c.Status,
      COUNT(b.BookingID) AS BookedSpots
    FROM Classes c
    LEFT JOIN Bookings b ON c.ClassID = b.ClassID
    GROUP BY c.ClassID
    ORDER BY c.StartDateTime ASC
  `);

  return rows;
}

export async function getBookingsByClassId(classId) {
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
      b.Amount,
      b.PaymentMethod,
      b.PaymentStatus,
      b.PaidAt
    FROM Bookings b
    JOIN Users u ON b.UserID = u.UserID
    WHERE b.ClassID = ?
    ORDER BY b.BookingDate DESC
    `,
    [classId]
  );

  return rows;
}

const CLASS_SELECT = `
  SELECT
    c.ClassID,
    c.Name,
    c.ClassTypeID,
    ct.TypeName AS ClassTypeName,
    ct.TypeName AS Category,
    c.TrainerID,
    u.UserID AS TrainerUserID,
    CONCAT(u.FirstName, ' ', u.LastName) AS TrainerName,
    DAYNAME(c.StartDateTime) AS dayOfWeek,
    DATE_FORMAT(c.StartDateTime, '%H:%i') AS startTime,
    DATE_FORMAT(c.EndDateTime, '%H:%i') AS endTime,
    c.StartDateTime,
    c.EndDateTime,
    c.MaxCapacity,
    c.Price,
    c.Room,
    c.Status,
    c.CreatedAt,
    c.UpdatedAt,
    COUNT(CASE WHEN b.Status = 'booked' THEN 1 END) AS BookedCount,
    c.MaxCapacity - COUNT(CASE WHEN b.Status = 'booked' THEN 1 END) AS SpotsLeft
  FROM Classes c
  JOIN Class_Types ct ON ct.ClassTypeID = c.ClassTypeID
  JOIN Trainers t ON t.TrainerID = c.TrainerID
  JOIN Users u ON u.UserID = t.UserID
  LEFT JOIN Bookings b ON b.ClassID = c.ClassID
`;

const CLASS_GROUP_ORDER = `
  GROUP BY
    c.ClassID, c.Name, c.ClassTypeID, ct.TypeName, ct.Category, c.TrainerID, u.UserID,
    u.FirstName, u.LastName, c.StartDateTime, c.EndDateTime, c.MaxCapacity, c.Price,
    c.Room, c.Status, c.CreatedAt, c.UpdatedAt
  ORDER BY c.StartDateTime ASC
`;

export async function findAll({ upcomingOnly = true, activeOnly = true } = {}) {
  const clauses = [];
  if (upcomingOnly) clauses.push(`c.StartDateTime >= NOW()`);
  if (activeOnly) clauses.push(`c.Status = 'scheduled'`);
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.execute(`${CLASS_SELECT} ${where} ${CLASS_GROUP_ORDER}`);
  return rows;
}

export async function findBookedClassIdsByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT ClassID
     FROM Bookings
     WHERE UserID = ? AND Status = 'booked'`,
    [userId]
  );
  return rows.map((row) => row.ClassID);
}

export async function findById(classId) {
  const [rows] = await pool.execute(
    `${CLASS_SELECT} WHERE c.ClassID = ? ${CLASS_GROUP_ORDER} LIMIT 1`,
    [classId]
  );

  return rows[0] ?? null;
}

export async function findByTrainer(trainerId) {
  const [rows] = await pool.execute(
    `${CLASS_SELECT} WHERE c.TrainerID = ? ${CLASS_GROUP_ORDER}`,
    [trainerId]
  );

  return rows;
}

export async function create({ name, classTypeId, trainerId, startDateTime, endDateTime, maxCapacity, price, room, status }) {
  const [result] = await pool.execute(
    `INSERT INTO Classes (Name, ClassTypeID, TrainerID, StartDateTime, EndDateTime, MaxCapacity, Price, Room, Status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, classTypeId, trainerId, startDateTime, endDateTime, maxCapacity, price ?? 0, room, status ?? 'scheduled']
  );

  return result.insertId;
}

export async function update(classId, fields) {
  const columnMap = {
    name: 'Name',
    classTypeId: 'ClassTypeID',
    trainerId: 'TrainerID',
    startDateTime: 'StartDateTime',
    endDateTime: 'EndDateTime',
    maxCapacity: 'MaxCapacity',
    price: 'Price',
    room: 'Room',
    status: 'Status',
  };

  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
  const assignments = entries.map(([key]) => `${columnMap[key]} = ?`);
  const values = entries.map(([, value]) => value);

  if (!assignments.length) return 0;

  const [result] = await pool.execute(
    `UPDATE Classes SET ${assignments.join(', ')} WHERE ClassID = ?`,
    [...values, classId]
  );

  return result.affectedRows;
}

export async function updateStatus(classId, status) {
  const [result] = await pool.execute(
    `UPDATE Classes SET Status = ? WHERE ClassID = ?`,
    [status, classId]
  );

  return result.affectedRows;
}

export async function remove(classId) {
  const [result] = await pool.execute(
    `DELETE FROM Classes WHERE ClassID = ?`,
    [classId]
  );

  return result.affectedRows;
}

export async function findBookingByUserAndClass(userId, classId) {
  const [rows] = await pool.execute(
    `SELECT BookingID, UserID, ClassID, Status
     FROM Bookings
     WHERE UserID = ? AND ClassID = ?
     LIMIT 1`,
    [userId, classId]
  );
  return rows[0] ?? null;
}

export async function createBooking({ userId, classId, amount, paymentMethod, paymentStatus, paidAt }) {
  const [result] = await pool.execute(
    `INSERT INTO Bookings (UserID, ClassID, Status, Amount, PaymentMethod, PaymentStatus, PaidAt)
     VALUES (?, ?, 'booked', ?, ?, ?, ?)`,
    [userId, classId, amount, paymentMethod, paymentStatus, paidAt]
  );
  return result.insertId;
}

export async function findBookingById(bookingId) {
  const [rows] = await pool.execute(
    `SELECT BookingID, UserID, ClassID, BookingDate, Status, Amount, PaymentMethod, PaymentStatus, PaidAt
     FROM Bookings
     WHERE BookingID = ?
     LIMIT 1`,
    [bookingId]
  );
  return rows[0] ?? null;
}

export async function findBookingWithClassById(bookingId) {
  const [rows] = await pool.execute(
    `
    SELECT
      b.BookingID,
      b.UserID,
      b.ClassID,
      b.BookingDate,
      b.Status,
      b.Amount,
      b.PaymentMethod,
      b.PaymentStatus,
      b.PaidAt,
      c.StartDateTime,
      c.Status AS ClassStatus
    FROM Bookings b
    JOIN Classes c ON c.ClassID = b.ClassID
    WHERE b.BookingID = ?
    LIMIT 1
    `,
    [bookingId]
  );
  return rows[0] ?? null;
}

export async function updateBooking(bookingId, fields) {
  const columnMap = {
    status: 'Status',
    paymentStatus: 'PaymentStatus',
    paidAt: 'PaidAt',
  };

  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
  const assignments = entries.map(([key]) => `${columnMap[key]} = ?`);
  const values = entries.map(([, value]) => value);

  if (!assignments.length) return 0;

  const [result] = await pool.execute(
    `UPDATE Bookings SET ${assignments.join(', ')} WHERE BookingID = ?`,
    [...values, bookingId]
  );
  return result.affectedRows;
}

export async function findBookingsByUser(userId) {
  const [rows] = await pool.execute(
    `
    SELECT
      b.BookingID,
      b.UserID,
      b.ClassID,
      b.BookingDate,
      b.Status AS BookingStatus,
      b.Amount,
      b.PaymentMethod,
      b.PaymentStatus,
      b.PaidAt,
      c.Name,
      ct.TypeName AS ClassTypeName,
      ct.TypeName AS Category,
      c.StartDateTime,
      c.EndDateTime,
      c.Room,
      c.Status AS ClassStatus,
      CONCAT(u.FirstName, ' ', u.LastName) AS TrainerName
    FROM Bookings b
    JOIN Classes c ON c.ClassID = b.ClassID
    JOIN Class_Types ct ON ct.ClassTypeID = c.ClassTypeID
    JOIN Trainers t ON t.TrainerID = c.TrainerID
    JOIN Users u ON u.UserID = t.UserID
    WHERE b.UserID = ?
    ORDER BY c.StartDateTime ASC
    `,
    [userId]
  );
  return rows;
}

export async function findClassTypes() {
  const [rows] = await pool.execute(
    `SELECT ClassTypeID, TypeName, Category, Description, Price, IsActive
     FROM Class_Types
     WHERE IsActive = TRUE
     ORDER BY TypeName ASC`
  );

  return rows;
}

export async function findClassTypeByName(typeName) {
  const [rows] = await pool.execute(
    `SELECT ClassTypeID, TypeName, Category, Description, Price, IsActive
     FROM Class_Types
     WHERE TypeName = ? AND IsActive = TRUE
     LIMIT 1`,
    [typeName]
  );
  return rows[0] ?? null;
}

export async function findAllClassTypes() {
  const [rows] = await pool.execute(
    `SELECT ClassTypeID, TypeName, Category, Description, Price, IsActive, CreatedAt
     FROM Class_Types
     ORDER BY IsActive DESC, TypeName ASC`
  );

  return rows;
}

export async function findClassTypeById(classTypeId) {
  const [rows] = await pool.execute(
    `SELECT ClassTypeID, TypeName, Category, Description, Price, IsActive, CreatedAt
     FROM Class_Types
     WHERE ClassTypeID = ?
     LIMIT 1`,
    [classTypeId]
  );

  return rows[0] ?? null;
}

export async function createClassType({ typeName, category, description, price }) {
  const [result] = await pool.execute(
    `INSERT INTO Class_Types (TypeName, Category, Description, Price)
     VALUES (?, ?, ?, ?)`,
    [typeName, category ?? null, description ?? null, price ?? 0]
  );

  return result.insertId;
}

export async function updateClassType(classTypeId, fields) {
  const columnMap = {
    typeName: 'TypeName',
    category: 'Category',
    description: 'Description',
    price: 'Price',
    isActive: 'IsActive',
  };

  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
  const assignments = entries.map(([key]) => `${columnMap[key]} = ?`);
  const values = entries.map(([, value]) => value);

  if (!assignments.length) return 0;

  const [result] = await pool.execute(
    `UPDATE Class_Types SET ${assignments.join(', ')} WHERE ClassTypeID = ?`,
    [...values, classTypeId]
  );

  return result.affectedRows;
}

export async function deactivateClassType(classTypeId) {
  const [result] = await pool.execute(
    `UPDATE Class_Types SET IsActive = FALSE WHERE ClassTypeID = ?`,
    [classTypeId]
  );

  return result.affectedRows;
}

export async function findActiveTrainers() {
  const [rows] = await pool.execute(
    `SELECT
       t.TrainerID,
       u.UserID,
       CONCAT(u.FirstName, ' ', u.LastName) AS TrainerName,
       t.Specialization
     FROM Trainers t
     JOIN Users u ON u.UserID = t.UserID
     WHERE u.IsActive = TRUE
     ORDER BY u.FirstName ASC, u.LastName ASC`
  );

  return rows;
}

export async function findTrainerByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT TrainerID, UserID FROM Trainers WHERE UserID = ? LIMIT 1`,
    [userId]
  );

  return rows[0] ?? null;
}

export async function classTypeExists(classTypeId) {
  const [rows] = await pool.execute(
    `SELECT ClassTypeID FROM Class_Types WHERE ClassTypeID = ? AND IsActive = TRUE LIMIT 1`,
    [classTypeId]
  );

  return Boolean(rows[0]);
}

export async function trainerExists(trainerId) {
  const [rows] = await pool.execute(
    `SELECT t.TrainerID
     FROM Trainers t
     JOIN Users u ON u.UserID = t.UserID
     WHERE t.TrainerID = ? AND u.IsActive = TRUE
     LIMIT 1`,
    [trainerId]
  );

  return Boolean(rows[0]);
}
