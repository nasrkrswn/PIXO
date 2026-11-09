# PIXO API modules

Place each feature in its own directory (for example `auth`, `catalog`, `cart`, `orders`, and `promotions`). Keep HTTP handlers in controllers, business rules in services, and request validation schemas beside their module. Use Prisma's generated types rather than duplicating database models.
