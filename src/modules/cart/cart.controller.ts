import type { Request, RequestHandler } from "express";
import { ApiError } from "../../utils/api-error.js";
import { addCartItemSchema, updateCartItemSchema } from "./cart.schemas.js";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "./cart.service.js";

function requireUserId(request: Request): string {
  if (!request.user) throw new ApiError(401, "Authentication is required");
  return request.user.id;
}

export const getCartController: RequestHandler = async (request, response) => {
  response.status(200).json(await getCart(requireUserId(request)));
};

export const addCartItemController: RequestHandler = async (request, response) => {
  const input = addCartItemSchema.parse(request.body);
  response.status(200).json(await addCartItem(requireUserId(request), input));
};

export const updateCartItemController: RequestHandler = async (request, response) => {
  const params = updateCartItemSchema.shape.productId.parse(request.params.productId);
  const body = updateCartItemSchema.omit({ productId: true }).parse(request.body);
  response.status(200).json(await updateCartItem(requireUserId(request), { productId: params, ...body }));
};

export const removeCartItemController: RequestHandler = async (request, response) => {
  const productId = updateCartItemSchema.shape.productId.parse(request.params.productId);
  response.status(200).json(await removeCartItem(requireUserId(request), productId));
};

export const clearCartController: RequestHandler = async (request, response) => {
  response.status(200).json(await clearCart(requireUserId(request)));
};
