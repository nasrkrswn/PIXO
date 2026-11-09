import type { Request, RequestHandler } from "express";
import { ApiError } from "../../utils/api-error.js";
import { createOrderSchema, idempotencyKeySchema, orderIdSchema } from "./order.schemas.js";
import { createOrder, getOrder } from "./order.service.js";

function requireIdentity(request: Request): { id: string; role: "CUSTOMER" | "ADMIN" | "DRIVER" } {
  if (!request.user) throw new ApiError(401, "Authentication is required");
  return request.user;
}

export const createOrderController: RequestHandler = async (request, response) => {
  const identity = requireIdentity(request);
  const input = createOrderSchema.parse(request.body);
  const idempotencyKey = idempotencyKeySchema.parse(request.get("Idempotency-Key"));
  const result = await createOrder(identity.id, input, idempotencyKey);

  response.status(result.replayed ? 200 : 201).json({ order: result.order, replayed: result.replayed });
};

export const getOrderController: RequestHandler = async (request, response) => {
  const identity = requireIdentity(request);
  const { id } = orderIdSchema.parse(request.params);
  response.status(200).json({ order: await getOrder(identity.id, identity.role, id) });
};
