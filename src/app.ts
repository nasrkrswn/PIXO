import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { cartRouter } from "./modules/cart/cart.routes.js";
import { orderRouter } from "./modules/orders/order.routes.js";
import { productRouter } from "./modules/products/product.routes.js";
import { promotionsRouter } from "./modules/promotions/promotions.routes.js";
import { healthRouter } from "./routes/health.routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ name: "PIXO | بيكسو", apiVersion: "v1" });
});
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/promotions", promotionsRouter);
app.use("/api/v1/orders", orderRouter);
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
app.use(errorHandler);
