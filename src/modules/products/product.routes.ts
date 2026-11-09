import { Router } from "express";
import { listProductsController, searchProductsController } from "./product.controller.js";

export const productRouter = Router();

// Keep the more specific search route alongside the collection route.
productRouter.get("/search", searchProductsController);
productRouter.get("/", listProductsController);
