import api from './axios'

export const getDashboard    = () => api.get('/admin/dashboard')
export const getClassBookings = () => api.get('/admin/class-bookings')
export const getUsers        = () => api.get('/admin/users')
export const createUser      = (data: any) => api.post('/admin/users', data)