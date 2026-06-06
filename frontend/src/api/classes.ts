import api from './axios'

export interface ClassPayload {
  name: string
  category: 'Yoga' | 'Pilates'
  date: string
  startTime: string
  endTime: string
  room: string
  maxCapacity: number
  trainerId?: number
}

export const getClasses = () => api.get('/classes')
export const getClassById = (id: number) => api.get(`/classes/${id}`)
export const getClassesByTrainer = (trainerId: number) => api.get(`/classes/trainer/${trainerId}`)
export const createClass = (payload: ClassPayload) => api.post('/classes', payload)
export const updateClass = (id: number, payload: ClassPayload) => api.put(`/classes/${id}`, payload)
export const cancelClass = (id: number) => api.put(`/classes/${id}/cancel`)
export const deleteClass = (id: number) => api.delete(`/classes/${id}`)
export const bookClass = (id: number) => api.post(`/classes/${id}/join`, { paymentMethod: 'card' })
