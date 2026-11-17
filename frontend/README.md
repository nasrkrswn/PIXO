# PIXO Frontend Demo

Arabic RTL storefront and admin dashboard built with Next.js App Router, TypeScript, and Tailwind CSS. When Supabase variables are configured, the product catalog is read from Supabase and admin product creation is stored there under Row Level Security (RLS). Catalog changes are refreshed on page focus and polled every 20 seconds so other open devices pick them up. Carts, orders, promotions, and customer sessions remain local demo data.

## Run

Use Node.js 20.19+ or 22.13+ (see the root `.nvmrc`), then from this folder:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3001`.

## Demo interactions

- Register or sign in from `/login` (the legacy `/account` URL remains available).
- To open `/admin`, use `admin@pixo.local` and any non-empty password.
- Add products at `/admin/products/new`; with Supabase configured, the product is inserted remotely and the storefront updates immediately. Other open clients refresh the catalog automatically.
- Add products to the cart, adjust quantities, and place a mock order. The dashboard order table reflects it.
- Order status edits persist locally in this browser.

Cart, order, promotion, and customer session data remains local to this browser. With Supabase configured, admin login uses Supabase Auth and requires an Auth user whose server-managed `app_metadata.role` is `ADMIN`. Without Supabase configuration, the admin login remains a local demo gate.

## Supabase catalog setup

1. Copy `frontend/.env.example` to `frontend/.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase project settings. A legacy anon key is accepted as a fallback.
2. Run `../supabase/schema.sql` in the Supabase SQL Editor. It creates the catalog tables, product image bucket, and public-read/admin-write RLS policies.
3. Create an admin user in Supabase Authentication. In SQL Editor, set the server-managed role claim with the example statement at the end of `supabase/schema.sql`, substituting that user's email. Then sign in to `/admin` with that Supabase Auth account.
4. Never add `service_role` or `sb_secret` keys to frontend environment variables. Rotate any such key that has been shared. The browser uses only the publishable key; Supabase Auth JWTs and RLS authorize admin writes.

The product table supports `compare_at_price`; set a sale price and a higher compare-at price in the admin form to show a discount badge and crossed-out previous price.

When Supabase is configured, product records are never merged with or loaded from the local demo catalog. A failed catalog request is shown in the storefront and can be retried; the app does not disguise a database error by showing stale local products.

## Source layout

- `src/app/` — storefront, cart, and account routes
- `src/app/admin/` — dashboard and Supabase-backed product form
- `src/components/` — customer and admin UI
- `src/context/` — Supabase-synchronized catalog and local demo session, order, promotion, and cart state
- `src/lib/demo-products.ts` — starter catalog

`src/lib/api-client.ts` is retained as a future API integration point and is not imported by the active storefront pages.

## Deploy to Vercel

The deployable Next.js app is in the `frontend` directory. In Vercel, import the repository and set **Root Directory** to `frontend`; leave the framework preset as Next.js and use the default install/build settings (`npm install` and `npm run build`). To use the Supabase catalog in production, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel's environment settings. Never commit `.env` files or put a service key in a `NEXT_PUBLIC_` variable.

The main customer routes are `/`, `/products`, `/login`, `/cart`, and `/track-order`. The protected admin entry is `/admin`.
