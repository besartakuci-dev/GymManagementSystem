import api from './axios'

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer'

// Public — list all membership plans (ordered by price on the backend).
export const getPlans = () => api.get('/plans')

// Mock checkout — records a paid membership. No card data is ever sent.
export const subscribe = (planId: number, paymentMethod: PaymentMethod = 'card') =>
  api.post('/memberships', { planId, paymentMethod })

// Current user's memberships (most recent first) + the active one.
export const getMyMemberships = () => api.get('/memberships/me')

// Soft-cancel a membership (sets Status='cancelled'). No refund — payments are not real.
export const cancelMembership = (id: number) => api.put(`/memberships/${id}/cancel`)
