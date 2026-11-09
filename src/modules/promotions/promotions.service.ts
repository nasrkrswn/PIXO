import { Prisma } from "../../generated/prisma/client.js";
import type { Prisma as PrismaTypes } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import type { CreatePromotionInput } from "./promotions.schemas.js";

type TransactionClient = PrismaTypes.TransactionClient;
type CartLine = {
  productId: string;
  title: string;
  sku: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
};

function smallerAmount(left: Prisma.Decimal, right: Prisma.Decimal): Prisma.Decimal {
  return left.lte(right) ? left : right;
}

function calculateDiscount(discount: {
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "BUY_X_GET_Y";
  value: Prisma.Decimal;
  minPurchaseAmount: Prisma.Decimal | null;
  buyQuantity: number | null;
  getQuantity: number | null;
}, lines: CartLine[], subtotal: Prisma.Decimal): Prisma.Decimal {
  if (discount.minPurchaseAmount && subtotal.lt(discount.minPurchaseAmount)) return new Prisma.Decimal(0);

  switch (discount.type) {
    case "PERCENTAGE":
      return smallerAmount(subtotal.mul(discount.value).div(100).toDecimalPlaces(2), subtotal);
    case "FIXED_AMOUNT":
      return smallerAmount(discount.value, subtotal);
    case "BUY_X_GET_Y": {
      const buyQuantity = discount.buyQuantity ?? 0;
      const getQuantity = discount.getQuantity ?? 0;
      if (!buyQuantity || !getQuantity) return new Prisma.Decimal(0);

      // Count BxGy quantities per SKU so unrelated products cannot combine to trigger the offer.
      let freeUnits = lines.reduce(
        (sum, line) => sum + Math.floor(line.quantity / (buyQuantity + getQuantity)) * getQuantity,
        0,
      );
      let amount = new Prisma.Decimal(0);

      // The least expensive units are free, preventing the promotion from over-discounting.
      for (const line of [...lines].sort((a, b) => a.unitPrice.comparedTo(b.unitPrice))) {
        if (freeUnits <= 0) break;
        const unitsOnThisLine = Math.min(line.quantity, freeUnits);
        amount = amount.add(line.unitPrice.mul(unitsOnThisLine));
        freeUnits -= unitsOnThisLine;
      }
      return smallerAmount(amount, subtotal);
    }
  }
}

function serializeQuote(subtotal: Prisma.Decimal, selected: { promotion: { id: string; name: string; code: string | null; type: string }; amount: Prisma.Decimal } | null) {
  const discountAmount = selected?.amount ?? new Prisma.Decimal(0);
  return {
    subtotal,
    discountAmount,
    totalAmount: subtotal.sub(discountAmount),
    appliedDiscounts: selected
      ? [{ id: selected.promotion.id, name: selected.promotion.name, code: selected.promotion.code, type: selected.promotion.type, amountApplied: selected.amount }]
      : [],
  };
}

/** Recalculates against current product prices and active rules inside the caller's transaction. */
export async function calculateCartQuote(transaction: TransactionClient, userId: string, code?: string) {
  const cart = await transaction.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) throw new ApiError(400, "Your cart is empty");

  const lines: CartLine[] = cart.items.map((item) => ({
    productId: item.productId,
    title: item.product.title,
    sku: item.product.sku,
    quantity: item.quantity,
    unitPrice: item.product.price,
  }));
  const subtotal = lines.reduce(
    (sum, line) => sum.add(line.unitPrice.mul(line.quantity)),
    new Prisma.Decimal(0),
  );
  const now = new Date();
  const activePromotions = await transaction.discount.findMany({
    where: { isActive: true, startDate: { lte: now }, endDate: { gt: now } },
  });

  let coupon: (typeof activePromotions)[number] | undefined;
  if (code) {
    coupon = activePromotions.find((promotion) => promotion.kind === "PROMO_CODE" && promotion.code === code.toUpperCase());
    if (!coupon) throw new ApiError(422, "Promotion code is invalid, inactive, or expired");
    if (coupon.minPurchaseAmount && subtotal.lt(coupon.minPurchaseAmount)) {
      throw new ApiError(422, "Cart subtotal does not meet this promotion's minimum purchase amount");
    }
  }

  const automatic = activePromotions.filter((promotion) => promotion.kind !== "PROMO_CODE");
  const candidates = [...automatic, ...(coupon ? [coupon] : [])]
    .map((promotion) => ({
      promotion,
      amount: calculateDiscount(promotion, lines, subtotal),
    }))
    .filter(({ promotion, amount }) => {
      if (promotion.kind === "PROMO_CODE" && amount.isZero()) {
        throw new ApiError(422, "Your cart does not qualify for this promotion");
      }
      return amount.gt(0);
    })
    .sort((a, b) => b.amount.comparedTo(a.amount));

  const quote = serializeQuote(subtotal, candidates[0] ?? null);
  return {
    cartId: cart.id,
    lines,
    subtotal: quote.subtotal,
    discountAmount: quote.discountAmount,
    totalAmount: quote.totalAmount,
    appliedDiscounts: quote.appliedDiscounts,
  };
}

export async function previewCartPromotion(userId: string, code: string) {
  return prisma.$transaction((transaction) => calculateCartQuote(transaction, userId, code));
}

export async function listActivePromotions() {
  const now = new Date();
  return prisma.discount.findMany({
    where: { isActive: true, startDate: { lte: now }, endDate: { gt: now } },
    select: { id: true, name: true, kind: true, type: true, code: true, value: true, minPurchaseAmount: true, startDate: true, endDate: true },
    orderBy: { endDate: "asc" },
  });
}

export async function createPromotion(input: CreatePromotionInput) {
  try {
    return await prisma.discount.create({
      data: {
        name: input.name,
        kind: input.kind,
        type: input.type,
        code: input.code ?? null,
        value: input.value.toFixed(2),
        minPurchaseAmount: input.minPurchaseAmount?.toFixed(2) ?? null,
        buyQuantity: input.buyQuantity ?? null,
        getQuantity: input.getQuantity ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: input.isActive,
      },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new ApiError(409, "A promotion with this code already exists");
    }
    throw error;
  }
}

export async function setPromotionActive(id: string, isActive: boolean) {
  try {
    return await prisma.discount.update({ where: { id }, data: { isActive } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      throw new ApiError(404, "Promotion not found");
    }
    throw error;
  }
}

export async function deactivatePromotion(id: string) {
  return setPromotionActive(id, false);
}
