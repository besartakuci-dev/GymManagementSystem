import { z } from 'zod';

const idParam = z.coerce.number().int().positive('Invalid class type id');

const classTypeBody = z.object({
  typeName: z.string().min(1, 'Class type name is required').max(100),
  category: z.string().max(60).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const createClassTypeSchema = z.object({
  body: classTypeBody.omit({ isActive: true }),
});

export const updateClassTypeSchema = z.object({
  params: z.object({ id: idParam }),
  body: classTypeBody.partial().refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  }),
});

export const classTypeIdSchema = z.object({
  params: z.object({ id: idParam }),
});
