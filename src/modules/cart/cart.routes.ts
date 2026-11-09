import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  addCartItemController,
  clearCartController,
  getCartController,
  removeCartItemController,
  updateCartItemController,
} from "./cart.controller.js";

export const cartRouter = Router();

cartRouter.use(authenticate);
cartRouter.get("/", getCartController);
cartRouter.post("/", addCartItemController);
cartRouter.patch("/items/:productId", updateCartItemController);
cartRouter.delete("/items/:productId", removeCartItemController);
cartRouter.delete("/", clearCartController);
