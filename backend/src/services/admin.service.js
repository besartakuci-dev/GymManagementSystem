import {
  getDashboardStats,
  getClassBookingsStats,
} from '../models/admin.model.js';

import {
  findAllUsers,
  findById,
  createUserWithRole,
} from '../models/user.model.js';

import bcrypt from 'bcrypt';

export async function getDashboardData() {
  return await getDashboardStats();
}

export async function getClassBookingsData() {
  return await getClassBookingsStats();
}

export async function getAllUsers() {
  return await findAllUsers();
}

export async function createAdminUser({ email, password, firstName, lastName, phone, dateOfBirth, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await createUserWithRole({ email, passwordHash, role: role ?? 'member', firstName, lastName, phone, dateOfBirth });
  return findById(userId);
}