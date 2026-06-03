import {
  getDashboardClasses,
  getBookingsByClassId
} from '../models/class.model.js';

export async function getClassesDashboard() {
  return await getDashboardClasses();
}

export async function getClassBookings(classId) {
  return await getBookingsByClassId(classId);
}