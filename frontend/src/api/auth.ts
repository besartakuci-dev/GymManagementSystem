import api from './axios'

export interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  dateOfBirth?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export const register = (data: RegisterPayload) => api.post('/auth/register', data)
export const login = (data: LoginPayload) => api.post('/auth/login', data)
export const getMe = () => api.get('/auth/me')
