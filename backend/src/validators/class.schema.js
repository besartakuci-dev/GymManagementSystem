import { z } from 'zod';

const statusSchema = z.enum(['scheduled', 'cancelled', 'completed']);
const paymentMethodSchema = z.enum(['cash', 'card', 'bank_transfer']);
const idParam = z.coerce.number().int().positive('Invalid class id');
const categorySchema = z.enum(['Yoga', 'Pilates']);

const timeSchema = (label) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, `${label} must be in HH:MM format`);

const dateSchema = z
  .string()
  .min(1, 'Date is required')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00`)), 'Invalid date');

const legacyDateTime = z
  .string()
  .min(1, 'Date/time is required')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date/time');

const baseClassBody = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100, 'Name cannot exceed 100 characters'),
  category: categorySchema,
  date: dateSchema,
  startTime: timeSchema('Start time'),
  endTime: timeSchema('End time'),
  room: z.string().trim().min(1, 'Room is required').max(50, 'Room cannot exceed 50 characters'),
  maxCapacity: z.coerce
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(100, 'Capacity cannot exceed 100'),
  trainerId: z.coerce.number().int().positive('Trainer is required').optional(),
});

function combineDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

function validateClassTime(data, context) {
  const startDateTime = combineDateTime(data.date, data.startTime);
  const endDateTime = combineDateTime(data.date, data.endTime);

  if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) return;

  if (startDateTime < new Date()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Class date and start time cannot be in the past',
      path: ['date'],
    });
  }

  if (endDateTime <= startDateTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End time must be after start time',
      path: ['endTime'],
    });
  }
}

export const createClassSchema = z.object({
  body: baseClassBody.superRefine(validateClassTime),
});

export const updateClassSchema = z.object({
  params: z.object({ id: idParam }),
  body: baseClassBody.superRefine(validateClassTime),
});

export const classIdSchema = z.object({
  params: z.object({ id: idParam }),
});

export const trainerClassSchema = z.object({
  params: z.object({ trainerId: idParam }),
});

export const joinClassSchema = z.object({
  params: z.object({ id: idParam }),
  body: z.object({
    paymentMethod: paymentMethodSchema.default('card'),
  }),
});

export const legacyCreateClassSchema = z.object({
  body: z.object({
    classTypeId: z.coerce.number().int().positive('Class type is required'),
    trainerId: z.coerce.number().int().positive('Trainer is required').optional(),
    startDateTime: legacyDateTime,
    endDateTime: legacyDateTime,
    maxCapacity: z.coerce.number().int().min(1).max(100),
    price: z.coerce.number().nonnegative('Price cannot be negative').optional(),
    status: statusSchema.default('scheduled'),
  }),
});
