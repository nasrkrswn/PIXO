import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import {
  applyPromotionController,
  createPromotionController,
  deactivatePromotionController,
  listActivePromotionsController,
  setPromotionActiveController,
} from "./promotions.controller.js";

export const promotionsRouter = Router();

promotionsRouter.get("/active", listActivePromotionsController);
promotionsRouter.post("/apply", authenticate, applyPromotionController);
promotionsRouter.post("/", authenticate, authorize(Role.ADMIN), createPromotionController);
promotionsRouter.patch("/:id/active", authenticate, authorize(Role.ADMIN), setPromotionActiveController);
promotionsRouter.delete("/:id", authenticate, authorize(Role.ADMIN), deactivatePromotionController);
