import bcrypt from 'bcrypt';
import { findByEmail, findById, createUser } from '../models/user.model.js';
import { signToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

const BCRYPT_ROUNDS = 10;

function buildTokenPayload(user) {
  return { sub: user.UserID, role: user.Role, email: user.Email };
}

function safeUser(user) {
  const { PasswordHash, ...safe } = user;
  return safe;
}

export async function register({ email, password, firstName, lastName, phone, dateOfBirth }) {
  // ER_DUP_ENTRY on duplicate email bubbles to the centralized error handler → 409
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const userId = await createUser({ email, passwordHash, firstName, lastName, phone, dateOfBirth });
  const user = await findById(userId);
  const token = signToken(buildTokenPayload(user));
  return { token, user };
}

export async function login({ email, password }) {
  const user = await findByEmail(email);
  const valid = user && user.IsActive && (await bcrypt.compare(password, user.PasswordHash));
  if (!valid) {
    throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }
  const token = signToken(buildTokenPayload(user));
  return { token, user: safeUser(user) };
}

export async function getProfile(userId) {
  const user = await findById(userId);
  if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  return user;
}
