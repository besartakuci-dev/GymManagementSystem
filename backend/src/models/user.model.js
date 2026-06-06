import { pool } from '../config/db.js';

const SAFE_COLUMNS =
  'UserID, Email, Role, FirstName, LastName, Phone, DateOfBirth, JoinDate, IsActive, CreatedAt';

export async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT UserID, Email, PasswordHash, Role, FirstName, LastName, IsActive
     FROM Users WHERE Email = ? LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findById(userId) {
  const [rows] = await pool.execute(
    `SELECT ${SAFE_COLUMNS} FROM Users WHERE UserID = ? LIMIT 1`,
    [userId]
  );
  return rows[0] ?? null;
}

export async function createUser({ email, passwordHash, firstName, lastName, phone, dateOfBirth }) {
  const [result] = await pool.execute(
    `INSERT INTO Users (Email, PasswordHash, Role, FirstName, LastName, Phone, DateOfBirth)
     VALUES (?, ?, 'member', ?, ?, ?, ?)`,
    [email, passwordHash, firstName, lastName, phone ?? null, dateOfBirth ?? null]
  );
  return result.insertId;
}

export async function createUserWithRole({ email, passwordHash, role, firstName, lastName, phone, dateOfBirth }) {
  const [result] = await pool.execute(
    `INSERT INTO Users (Email, PasswordHash, Role, FirstName, LastName, Phone, DateOfBirth)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [email, passwordHash, role, firstName, lastName, phone ?? null, dateOfBirth ?? null]
  );
  return result.insertId;
}

export async function findAllUsers() {
  const [rows] = await pool.execute(
    `SELECT ${SAFE_COLUMNS} FROM Users ORDER BY CreatedAt DESC`
  );
  return rows;
}
