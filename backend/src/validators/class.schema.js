import { z } from 'zod';

const statusSchema = z.enum(['scheduled', 'cancelled', 'completed']);
const idParam = z.coerce.number().int().positive('Invalid class id');

const dateTime = z
  .string()
  .min(1, 'Date/time is required')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date/time');

const baseClassBody = z.object({
  classTypeId: z.coerce.number().int().positive('Class type is required'),
  trainerId: z.coerce.number().int().positive('Trainer is required').optional(),
  startDateTime: dateTime,
  endDateTime: dateTime,
  maxCapacity: z.coerce.number().int().positive('Capacity must be greater than 0'),
  status: statusSchema.default('scheduled'),
});

const createClassBody = baseClassBody.refine(
  (data) => new Date(data.endDateTime) > new Date(data.startDateTime),
  {
    message: 'End date/time must be after start date/time',
    path: ['endDateTime'],
  }
);

const updateClassBody = baseClassBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  })
  .superRefine((data, context) => {
    if (
      data.startDateTime &&
      data.endDateTime &&
      new Date(data.endDateTime) <= new Date(data.startDateTime)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date/time must be after start date/time',
        path: ['endDateTime'],
      });
    }
  });

export const createClassSchema = z.object({
  body: createClassBody,
});

export const updateClassSchema = z.object({
  params: z.object({ id: idParam }),
  body: updateClassBody,
});

export const classIdSchema = z.object({
  params: z.object({ id: idParam }),
});
