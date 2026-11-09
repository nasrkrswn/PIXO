import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";
import type { ProductFilters, ProductSearchInput } from "./product.schemas.js";

const productInclude = { category: true } as const;

function makeWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  return {
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? {
          price: {
            ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
    ...(filters.minRating !== undefined ? { ratingAverage: { gte: filters.minRating } } : {}),
    ...(filters.isFeatured !== undefined ? { isFeatured: filters.isFeatured } : {}),
  };
}

function makeOrderBy(filters: ProductFilters): Prisma.ProductOrderByWithRelationInput {
  switch (filters.sort) {
    case "price":
      return { price: filters.direction };
    case "rating":
      return { ratingAverage: filters.direction };
    case "title":
      return { title: filters.direction };
    case "newest":
    default:
      return { createdAt: filters.direction };
  }
}

export async function listProducts(filters: ProductFilters) {
  const where = makeWhere(filters);
  const skip = (filters.page - 1) * filters.pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: makeOrderBy(filters),
      skip,
      take: filters.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize),
    },
  };
}

type SearchHit = { id: string; rank: number };
type SearchCount = { total: number };

export async function searchProducts(input: ProductSearchInput) {
  const { q, ...filters } = input;
  const document = Prisma.sql`to_tsvector('simple', concat_ws(' ', p."title", COALESCE(p."description", '')))`;
  const query = Prisma.sql`plainto_tsquery('simple', ${q})`;
  const conditions: Prisma.Sql[] = [Prisma.sql`${document} @@ ${query}`];

  if (filters.categoryId) conditions.push(Prisma.sql`p."categoryId" = ${filters.categoryId}::uuid`);
  if (filters.minPrice !== undefined) conditions.push(Prisma.sql`p."price" >= ${filters.minPrice}::numeric`);
  if (filters.maxPrice !== undefined) conditions.push(Prisma.sql`p."price" <= ${filters.maxPrice}::numeric`);
  if (filters.minRating !== undefined) conditions.push(Prisma.sql`p."ratingAverage" >= ${filters.minRating}::numeric`);
  if (filters.isFeatured !== undefined) conditions.push(Prisma.sql`p."isFeatured" = ${filters.isFeatured}`);

  const whereClause = Prisma.join(conditions, " AND ");
  const rank = Prisma.sql`ts_rank(${document}, ${query})`;
  const offset = (filters.page - 1) * filters.pageSize;
  const direction = filters.direction === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  const orderBy = (() => {
    switch (filters.sort) {
      case "price":
        return Prisma.sql`p."price" ${direction}, ${rank} DESC`;
      case "rating":
        return Prisma.sql`p."ratingAverage" ${direction}, ${rank} DESC`;
      case "title":
        return Prisma.sql`p."title" ${direction}, ${rank} DESC`;
      case "newest":
      default:
        return Prisma.sql`${rank} DESC, p."createdAt" DESC`;
    }
  })();

  const [hits, countRows] = await Promise.all([
    prisma.$queryRaw<SearchHit[]>(Prisma.sql`
      SELECT p."id"::text AS id, ${rank} AS rank
      FROM "Product" AS p
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${filters.pageSize} OFFSET ${offset}
    `),
    prisma.$queryRaw<SearchCount[]>(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM "Product" AS p
      WHERE ${whereClause}
    `),
  ]);

  const ids = hits.map(({ id }) => id);
  const products = ids.length
    ? await prisma.product.findMany({ where: { id: { in: ids } }, include: productInclude })
    : [];
  const byId = new Map(products.map((product) => [product.id, product]));
  const total = countRows[0]?.total ?? 0;

  return {
    items: ids.flatMap((id) => {
      const product = byId.get(id);
      return product ? [product] : [];
    }),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize),
    },
  };
}
