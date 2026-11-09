import { Prisma } from "../../generated/prisma/client.js";
import type { Role } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { calculateCartQuote } from "../promotions/promotions.service.js";
import type { CreateOrderInput } from "./order.schemas.js";

const orderInclude = {
  items: true,
  discounts: { include: { discount: { select: { id: true, name: true, code: true, type: true } } } },
  statusHistory: { orderBy: { timestamp: "asc" as const } },
} satisfies Prisma.OrderInclude;

function hasPrismaCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

export async function createOrder(userId: string, input: CreateOrderInput, idempotencyKey: string) {
  const uniqueSelector = { userId_idempotencyKey: { userId, idempotencyKey } };
  const priorOrder = await prisma.order.findUnique({ where: uniqueSelector, include: orderInclude });
  if (priorOrder) return { order: priorOrder, replayed: true };

  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        // Recheck inside the transaction in case a previous request used this key.
        const existing = await transaction.order.findUnique({ where: uniqueSelector, include: orderInclude });
        if (existing) return { order: existing, replayed: true };

        const quote = await calculateCartQuote(transaction, userId, input.discountCode);

        // Conditional decrements prevent checkout from selling stock that is no longer available.
        for (const line of quote.lines) {
          const updated = await transaction.product.updateMany({
            where: { id: line.productId, stockQuantity: { gte: line.quantity } },
            data: { stockQuantity: { decrement: line.quantity } },
          });
          if (updated.count !== 1) {
            throw new ApiError(409, `Insufficient stock for ${line.title}`);
          }
        }

        const order = await transaction.order.create({
          data: {
            userId,
            idempotencyKey,
            status: "PENDING",
            paymentStatus: "PENDING",
            paymentMethod: input.paymentMethod,
            subtotal: quote.subtotal,
            discountApplied: quote.discountAmount,
            totalAmount: quote.totalAmount,
            shippingAddress: input.shippingAddress as Prisma.InputJsonObject,
            items: {
              create: quote.lines.map((line) => ({
                productId: line.productId,
                productTitle: line.title,
                sku: line.sku,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                lineTotal: line.unitPrice.mul(line.quantity).toDecimalPlaces(2),
              })),
            },
            discounts: {
              create: quote.appliedDiscounts.map((discount) => ({
                discount: { connect: { id: discount.id } },
                amountApplied: discount.amountApplied,
              })),
            },
            statusHistory: {
              create: {
                status: "PENDING",
                updatedBy: userId,
                note: input.paymentMethod === "CARD" ? "Order placed; payment is awaiting a payment provider" : "Order placed",
              },
            },
          },
          include: orderInclude,
        });

        await transaction.cartItem.deleteMany({ where: { cartId: quote.cartId } });
        await transaction.cart.update({
          where: { id: quote.cartId },
          data: { totalAmount: new Prisma.Decimal(0) },
        });

        return { order, replayed: false };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return result;
  } catch (error) {
    if (hasPrismaCode(error, "P2034") || hasPrismaCode(error, "P2002")) {
      const replay = await prisma.order.findUnique({ where: uniqueSelector, include: orderInclude });
      if (replay) return { order: replay, replayed: true };
    }
    if (hasPrismaCode(error, "P2034")) {
      throw new ApiError(409, "Checkout conflicted with another stock update; retry with the same Idempotency-Key");
    }
    throw error;
  }
}

export async function getOrder(userId: string, role: Role, orderId: string) {
  const where: Prisma.OrderWhereInput = { id: orderId };
  if (role === "CUSTOMER") where.userId = userId;
  if (role === "DRIVER") where.driverId = userId;

  const order = await prisma.order.findFirst({ where, include: orderInclude });
  if (!order) throw new ApiError(404, "Order not found");
  return order;
}
