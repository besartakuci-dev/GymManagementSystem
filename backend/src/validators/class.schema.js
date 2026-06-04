import { z } from 'zod';

const statusSchema = z.enum(['scheduled', 'cancelled', 'completed']);
const paymentMethodSchema = z.enum(['cash', 'card', 'bank_transfer']);
const idParam = z.coerce.number().int().positive('Invalid class id');

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const dayOfWeek = z
  .string()
  .min(1, 'Day of week is required')
  .transform((value) => {
    const normalized = value.trim().toLowerCase();
    const match = WEEKDAYS.find((day) => day === normalized || day.startsWith(normalized.slice(0, 3)));
    if (!match) return value.trim();
    return match.charAt(0).toUpperCase() + match.slice(1);
  })
  .refine((value) => WEEKDAYS.some((day) => day === value.toLowerCase()), 'Invalid day of week');

const startTime = z
  .string()
  .min(1, 'Start time is required')
  .regex(/^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Start time must be in HH:MM or HH:MM:SS format')
  .transform((value) => value.slice(0, 5));

const dateTime = z
  .string()
  .min(1, 'Date/time is required')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date/time');

const baseClassBody = z.object({
  classTypeId: z.coerce.number().int().positive('Class type is required'),
  trainerId: z.coerce.number().int().positive('Trainer is required').optional(),
  dayOfWeek: dayOfWeek.optional(),
  startTime: startTime.optional(),
  startDateTime: dateTime.optional(),
  endDateTime: dateTime.optional(),
  maxCapacity: z.coerce.number().int().positive('Capacity must be greater than 0'),
  price: z.coerce.number().nonnegative('Price cannot be negative').optional(),
  status: statusSchema.default('scheduled'),
});

function validateScheduleInput(data, context) {
  const hasSchedule = Boolean(data.dayOfWeek && data.startTime);
  const hasDateTime = Boolean(data.startDateTime && data.endDateTime);

  if (!hasSchedule && !hasDateTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Provide dayOfWeek and startTime, or startDateTime and endDateTime',
      path: ['dayOfWeek'],
    });
  }

  if (hasDateTime && new Date(data.endDateTime) <= new Date(data.startDateTime)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End date/time must be after start date/time',
      path: ['endDateTime'],
    });
  }
}

const createClassBody = baseClassBody.superRefine(validateScheduleInput);

const updateClassBody = baseClassBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  })
  .superRefine((data, context) => {
    const touchesSchedule = data.dayOfWeek !== undefined || data.startTime !== undefined;
    const touchesDateTime = data.startDateTime !== undefined || data.endDateTime !== undefined;

    if (touchesSchedule && !(data.dayOfWeek && data.startTime)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Both dayOfWeek and startTime are required when updating the schedule',
        path: ['dayOfWeek'],
      });
    }

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

    if (touchesSchedule && touchesDateTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide either dayOfWeek and startTime, or startDateTime and endDateTime',
        path: ['dayOfWeek'],
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

export const joinClassSchema = z.object({
  params: z.object({ id: idParam }),
  body: z.object({
    paymentMethod: paymentMethodSchema,
  }),
});
