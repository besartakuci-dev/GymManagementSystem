import api from './axios'

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer'

export const getPlans = () => api.get('/memberships/plans')
export const getMyMembership = () => api.get('/memberships/me')
export const buyMembership = (planId: number, paymentMethod: PaymentMethod = 'card') =>
  api.post('/memberships', { planId, paymentMethod })
