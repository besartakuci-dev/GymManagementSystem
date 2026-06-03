import { getDashboardClasses } from '../models/class.model.js';

export async function getClassesDashboard() {
  return await getDashboardClasses();
}