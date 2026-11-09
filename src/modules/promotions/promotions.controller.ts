import type { Request, RequestHandler } from "express";
import { ApiError } from "../../utils/api-error.js";
import { applyPromotionSchema, createPromotionSchema, promotionActiveSchema, promotionIdSchema } from "./promotions.schemas.js";
import {
  createPromotion,
  deactivatePromotion,
  listActivePromotions,
  previewCartPromotion,
  setPromotionActive,
} from "./promotions.service.js";

function requireUserId(request: Request): string {
  if (!request.user) throw new ApiError(401, "Authentication is required");
  return request.user.id;
}

export const listActivePromotionsController: RequestHandler = async (_request, response) => {
  response.status(200).json({ items: await listActivePromotions() });
};

export const applyPromotionController: RequestHandler = async (request, response) => {
  const { code } = applyPromotionSchema.parse(request.body);
  const quote = await previewCartPromotion(requireUserId(request), code);
  response.status(200).json({
    ...quote,
    subtotal: quote.subtotal.toFixed(2),
    discountAmount: quote.discountAmount.toFixed(2),
    totalAmount: quote.totalAmount.toFixed(2),
    appliedDiscounts: quote.appliedDiscounts.map((discount) => ({ ...discount, amountApplied: discount.amountApplied.toFixed(2) })),
  });
};

export const createPromotionController: RequestHandler = async (request, response) => {
  const promotion = await createPromotion(createPromotionSchema.parse(request.body));
  response.status(201).json({ promotion });
};

export const setPromotionActiveController: RequestHandler = async (request, response) => {
  const { id } = promotionIdSchema.parse(request.params);
  const { isActive } = promotionActiveSchema.parse(request.body);
  response.status(200).json({ promotion: await setPromotionActive(id, isActive) });
};

export const deactivatePromotionController: RequestHandler = async (request, response) => {
  const { id } = promotionIdSchema.parse(request.params);
  response.status(200).json({ promotion: await deactivatePromotion(id) });
};
