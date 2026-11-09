-- Apply after the initial Prisma migration creates the "Product" table.
-- Keep this expression in sync with the search document in product.service.ts.
CREATE INDEX IF NOT EXISTS "Product_full_text_search_idx"
ON "Product"
USING GIN (
  to_tsvector('simple', concat_ws(' ', "title", COALESCE("description", '')))
);
