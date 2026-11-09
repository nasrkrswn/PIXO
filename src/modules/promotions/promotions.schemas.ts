import { z } from "zod";

const promotionCodeSchema = z
  .string()
  .trim()
  .min(3)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/)
  .transform((code) => code.toUpperCase());

export const applyPromotionSchema = z.object({
  code: promotionCodeSchema,
});

export const createPromotionSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    kind: z.enum(["AUTOMATIC", "FLASH_SALE", "PROMO_CODE"]),
    type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "BUY_X_GET_Y"]),
    code: promotionCodeSchema.optional(),
    value: z.coerce.number().finite().min(0).default(0),
    minPurchaseAmount: z.coerce.number().finite().positive().optional(),
    buyQuantity: z.coerce.number().int().positive().max(1000).optional(),
    getQuantity: z.coerce.number().int().positive().max(1000).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: z.boolean().default(false),
  })
  .superRefine((promotion, context) => {
    if (promotion.endDate <= promotion.startDate) {
      context.addIssue({ code: "custom", path: ["endDate"], message: "endDate must be after startDate" });
    }

    if (promotion.kind === "PROMO_CODE" && !promotion.code) {
      context.addIssue({ code: "custom", path: ["code"], message: "A code is required for PROMO_CODE offers" });
    }
    if (promotion.kind !== "PROMO_CODE" && promotion.code) {
      context.addIssue({ code: "custom", path: ["code"], message: "Only PROMO_CODE offers may define a code" });
    }

    if (promotion.type === "PERCENTAGE" && (promotion.value <= 0 || promotion.value > 100)) {
      context.addIssue({ code: "custom", path: ["value"], message: "Percentage must be greater than 0 and at most 100" });
    }
    if (promotion.type === "FIXED_AMOUNT" && promotion.value <= 0) {
      context.addIssue({ code: "custom", path: ["value"], message: "Fixed amount must be greater than 0" });
    }
    if (promotion.type === "BUY_X_GET_Y" && (!promotion.buyQuantity || !promotion.getQuantity)) {
      context.addIssue({ code: "custom", path: ["buyQuantity"], message: "BUY_X_GET_Y requires buyQuantity and getQuantity" });
    }
  });

export const promotionIdSchema = z.object({ id: z.string().uuid() });
export const promotionActiveSchema = z.object({ isActive: z.boolean() });

export type ApplyPromotionInput = z.infer<typeof applyPromotionSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
