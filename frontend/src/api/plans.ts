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

// --- Admin plan management (admin-only endpoints; the axios interceptor adds the Bearer token) ---
export interface PlanPayload {
  name: string
  price: number
  durationMonths?: number
  description?: string
  features?: string[]
  includesClasses?: boolean
  isPopular?: boolean
  sortOrder?: number
  isActive?: boolean
}

// Admin list — includes inactive (soft-deleted) plans (requires an admin token).
export const getAdminPlans = () => api.get('/plans', { params: { includeInactive: true } })
export const createPlan = (payload: PlanPayload) => api.post('/plans', payload)
export const updatePlan = (id: number, payload: PlanPayload) => api.patch(`/plans/${id}`, payload)
// Soft delete — sets IsActive=false (the only deactivation path; FK is ON DELETE RESTRICT).
export const deletePlan = (id: number) => api.delete(`/plans/${id}`)
