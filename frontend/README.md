# PIXO Frontend Demo

Arabic RTL storefront and admin dashboard built with Next.js App Router, TypeScript, and Tailwind CSS. This stage runs entirely in the browser using mock data and local storage; it does not require the Express API, Prisma, Supabase, or a database.

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
- Add products at `/admin/products/new`; the storefront updates immediately.
- Add products to the cart, adjust quantities, and place a mock order. The dashboard order table reflects it.
- Order status edits persist locally in this browser.

All demo session, cart, product, promotion, and order data is saved in `localStorage` on this device only. Login credentials are not verified or sent anywhere, and the admin gate is for UI demonstration only.

## Source layout

- `src/app/` — storefront, cart, and account routes
- `src/app/admin/` — dashboard and local product form
- `src/components/` — customer and admin UI
- `src/context/` — local demo session, catalog, order, promotion, and cart state
- `src/lib/demo-products.ts` — starter catalog

Backend and database setup is intentionally deferred. `src/lib/api-client.ts` is retained as a future integration point but is not imported by the active demo pages.

## Deploy to Vercel

The deployable Next.js app is in the `frontend` directory. In Vercel, import the repository and set **Root Directory** to `frontend`; leave the framework preset as Next.js and use the default install/build settings (`npm install` and `npm run build`). No environment variables are required for the frontend-only mock experience. Add production secrets only if a real backend integration is enabled later; never commit `.env` files.

The main customer routes are `/`, `/products`, `/login`, `/cart`, and `/track-order`. The protected admin entry is `/admin`.