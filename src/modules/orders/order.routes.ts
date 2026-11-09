import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { createOrderController, getOrderController } from "./order.controller.js";

export const orderRouter = Router();

orderRouter.use(authenticate);
orderRouter.post("/", createOrderController);
orderRouter.get("/:id", getOrderController);
