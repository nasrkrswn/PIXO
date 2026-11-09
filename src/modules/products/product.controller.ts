import type { RequestHandler } from "express";
import { productFiltersSchema, productSearchSchema } from "./product.schemas.js";
import { listProducts, searchProducts } from "./product.service.js";

export const listProductsController: RequestHandler = async (request, response) => {
  const filters = productFiltersSchema.parse(request.query);
  response.status(200).json(await listProducts(filters));
};

export const searchProductsController: RequestHandler = async (request, response) => {
  const filters = productSearchSchema.parse(request.query);
  response.status(200).json(await searchProducts(filters));
};
