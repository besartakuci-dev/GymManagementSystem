import { z } from 'zod';

const paymentMethodSchema = z.enum(['cash', 'card', 'bank_transfer']);

export const purchaseMembershipSchema = z.object({
  body: z.object({
    planId: z.coerce.number().int().positive('Invalid plan id'),
    paymentMethod: paymentMethodSchema.default('card'),
  }),
});
