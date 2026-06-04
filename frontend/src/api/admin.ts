import api from './axios'

export const getDashboard = () =>
  api.get('/admin/dashboard')

export const getClassBookings = () =>
  api.get('/admin/class-bookings')