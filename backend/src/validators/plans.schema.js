import { z } from 'zod';

const idParam = z.coerce.number().int().positive('Invalid plan id');

const featureItem = z.string().min(1, 'A feature cannot be empty').max(200);

// Query flags arrive as strings (e.g. ?includeInactive=true). Treat only the
// literal "true" as true; everything else (including absence) stays falsy.
const boolFromQuery = z.preprocess(
  (value) => (typeof value === 'string' ? value.toLowerCase() === 'true' : value),
  z.boolean()
);

// Shared shape. name + price are the only required fields; the model fills the
// rest with sensible defaults (durationMonths -> 1, isActive -> true, etc.).
const planBody = z.object({
  name: z.string().min(1, 'Plan name is required').max(100),
  price: z.coerce.number().finite('Price must be a finite number').nonnegative('Price cannot be negative'),
  durationMonths: z.coerce.number().int().positive('Duration must be a positive number of months').optional(),
  description: z.string().max(2000).optional(),
  features: z.array(featureItem).max(50, 'Too many features').optional(),
  includesClasses: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0, 'Sort order cannot be negative').optional(),
});

export const listPlansSchema = z.object({
  query: z.object({
    // Honoured for admins only (enforced in the controller); ignored for the public.
    includeInactive: boolFromQuery.optional(),
  }),
});

export const createPlanSchema = z.object({
  // `isActive` is NOT settable on create (mirrors classType): new plans are active,
  // and deactivation goes exclusively through DELETE (soft delete). It stays available
  // on PATCH so an admin can re-activate a soft-deleted plan.
  body: planBody.omit({ isActive: true }),
});

export const updatePlanSchema = z.object({
  params: z.object({ id: idParam }),
  body: planBody.partial().refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  }),
});

export const planIdSchema = z.object({
  params: z.object({ id: idParam }),
});
