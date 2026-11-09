import { Prisma } from "../../generated/prisma/client.js";
import type { Prisma as PrismaTypes } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import type { AddCartItemInput, UpdateCartItemInput } from "./cart.schemas.js";

type TransactionClient = PrismaTypes.TransactionClient;

async function makeSnapshot(transaction: TransactionClient, cartId: string) {
  const records = await transaction.cartItem.findMany({
    where: { cartId },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  let total = new Prisma.Decimal(0);
  const items = await Promise.all(
    records.map(async (item) => {
      const currentPrice = item.product.price;
      if (!item.price.equals(currentPrice)) {
        await transaction.cartItem.update({ where: { id: item.id }, data: { price: currentPrice } });
      }

      const lineTotal = currentPrice.mul(item.quantity);
      total = total.add(lineTotal);
      return {
        id: item.id,
        productId: item.productId,
        title: item.product.title,
        sku: item.product.sku,
        image: item.product.images[0] ?? null,
        quantity: item.quantity,
        unitPrice: currentPrice.toFixed(2),
        lineTotal: lineTotal.toFixed(2),
        availableStock: item.product.stockQuantity,
        isAvailable: item.product.stockQuantity >= item.quantity,
      };
    }),
  );

  await transaction.cart.update({ where: { id: cartId }, data: { totalAmount: total } });
  return { id: cartId, items, totalAmount: total.toFixed(2) };
}

async function getOrCreateCart(transaction: TransactionClient, userId: string) {
  return transaction.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function getCart(userId: string) {
  return prisma.$transaction(async (transaction) => {
    const cart = await getOrCreateCart(transaction, userId);
    return makeSnapshot(transaction, cart.id);
  });
}

export async function addCartItem(userId: string, input: AddCartItemInput) {
  return prisma.$transaction(async (transaction) => {
    const product = await transaction.product.findUnique({
      where: { id: input.productId },
      select: { id: true, price: true, stockQuantity: true },
    });

    if (!product) throw new ApiError(404, "Product not found");

    const cart = await getOrCreateCart(transaction, userId);
    const existing = await transaction.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      select: { id: true, quantity: true },
    });
    const nextQuantity = (existing?.quantity ?? 0) + input.quantity;

    if (nextQuantity > product.stockQuantity) {
      throw new ApiError(409, "Requested quantity exceeds available stock");
    }

    await transaction.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      create: { cartId: cart.id, productId: product.id, quantity: input.quantity, price: product.price },
      update: { quantity: nextQuantity, price: product.price },
    });

    return makeSnapshot(transaction, cart.id);
  });
}

export async function updateCartItem(userId: string, input: UpdateCartItemInput) {
  return prisma.$transaction(async (transaction) => {
    const cart = await transaction.cart.findUnique({ where: { userId }, select: { id: true } });
    if (!cart) throw new ApiError(404, "Cart not found");

    const item = await transaction.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
      include: { product: { select: { price: true, stockQuantity: true } } },
    });
    if (!item) throw new ApiError(404, "Cart item not found");
    if (input.quantity > item.product.stockQuantity) {
      throw new ApiError(409, "Requested quantity exceeds available stock");
    }

    await transaction.cartItem.update({
      where: { id: item.id },
      data: { quantity: input.quantity, price: item.product.price },
    });

    return makeSnapshot(transaction, cart.id);
  });
}

export async function removeCartItem(userId: string, productId: string) {
  return prisma.$transaction(async (transaction) => {
    const cart = await transaction.cart.findUnique({ where: { userId }, select: { id: true } });
    if (!cart) throw new ApiError(404, "Cart not found");

    const result = await transaction.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    if (result.count === 0) throw new ApiError(404, "Cart item not found");
    return makeSnapshot(transaction, cart.id);
  });
}

export async function clearCart(userId: string) {
  return prisma.$transaction(async (transaction) => {
    const cart = await getOrCreateCart(transaction, userId);
    await transaction.cartItem.deleteMany({ where: { cartId: cart.id } });
    await transaction.cart.update({ where: { id: cart.id }, data: { totalAmount: new Prisma.Decimal(0) } });
    return { id: cart.id, items: [], totalAmount: "0.00" };
  });
}
