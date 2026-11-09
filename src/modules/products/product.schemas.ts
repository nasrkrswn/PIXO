import { z } from "zod";

const optionalBoolean = z.preprocess((value: unknown) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

export const productIdSchema = z.object({
  productId: z.string().uuid(),
});

export const productFiltersSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(24),
    categoryId: z.string().uuid().optional(),
    minPrice: z.coerce.number().finite().min(0).optional(),
    maxPrice: z.coerce.number().finite().min(0).optional(),
    minRating: z.coerce.number().finite().min(0).max(5).optional(),
    isFeatured: optionalBoolean,
    sort: z.enum(["newest", "price", "rating", "title"]).default("newest"),
    direction: z.enum(["asc", "desc"]).default("desc"),
  })
  .refine(
    ({ minPrice, maxPrice }) => minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    { path: ["maxPrice"], message: "maxPrice must be greater than or equal to minPrice" },
  );

export const productSearchSchema = productFiltersSchema.extend({
  q: z.string().trim().min(1).max(120),
});

/** Admin-side payload schema for future product create/update endpoints. */
export const productInputSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(20_000).optional(),
  price: z.coerce.number().finite().positive(),
  stockQuantity: z.coerce.number().int().min(0),
  sku: z.string().trim().min(1).max(100),
  images: z.array(z.string().url()).max(20).default([]),
  categoryId: z.string().uuid().optional(),
  isFeatured: z.boolean().default(false),
});

export type ProductFilters = z.infer<typeof productFiltersSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
