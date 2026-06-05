import {
  getDashboardStats,
  getClassBookingsStats,
} from '../models/admin.model.js';

export async function getDashboardData() {
  return await getDashboardStats();
}

export async function getClassBookingsData() {
  return await getClassBookingsStats();
}