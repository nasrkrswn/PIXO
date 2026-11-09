import { z } from "zod";

export const shippingAddressSchema = z.object({
  recipientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(32),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(24).optional(),
  countryCode: z.string().trim().regex(/^[A-Za-z]{2}$/).transform((value) => value.toUpperCase()),
});

export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "CARD"]),
  discountCode: z.string().trim().min(3).max(64).regex(/^[A-Za-z0-9_-]+$/).transform((code) => code.toUpperCase()).optional(),
});

export const orderIdSchema = z.object({ id: z.string().uuid() });
export const idempotencyKeySchema = z.string().trim().min(16).max(128).regex(/^[A-Za-z0-9._:-]+$/);

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
