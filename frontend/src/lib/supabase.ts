import type { StoreProduct } from "@/types/product";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_SESSION_KEY = "pixo.supabase.admin.session.v1";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; name?: string };
  app_metadata?: { role?: string };
}

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  user: SupabaseUser;
}

interface SupabaseProductRow {
  id: string;
  title: string;
  description: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  stock_quantity: number;
  sku: string;
  images: string[];
  rating_average: number | string;
  is_featured: boolean;
  category: { id: string; name: string; slug: string } | null;
}

export interface SupabaseNewProduct {
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  sku: string;
  images: string[];
  category: { name: string; slug: string };
}

function requireConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("أضف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY إلى frontend/.env.");
  }
  return { url: SUPABASE_URL, key: SUPABASE_KEY };
}

async function supabaseFetch<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const { url, key } = requireConfig();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken ?? key}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const details = await response.json().catch(() => null) as { message?: string; msg?: string; hint?: string } | null;
    const reason = details?.message ?? details?.msg ?? details?.hint ?? `HTTP ${response.status}`;
    throw new Error(`Supabase: ${reason}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function mapProduct(row: SupabaseProductRow): StoreProduct {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    stockQuantity: row.stock_quantity,
    sku: row.sku,
    images: Array.isArray(row.images) ? row.images : [],
    ratingAverage: row.rating_average,
    isFeatured: row.is_featured,
    category: row.category,
  };
}

/** Fetches public catalog products. Supabase RLS remains responsible for read access. */
export async function fetchSupabaseProducts(): Promise<StoreProduct[]> {
  const rows = await supabaseFetch<SupabaseProductRow[]>(
    "/rest/v1/products?select=id,title,description,price,compare_at_price,stock_quantity,sku,images,rating_average,is_featured,category:categories(id,name,slug)&order=created_at.desc",
  );
  return rows.map(mapProduct);
}

/** Development smoke check: queries products without logging catalog contents. */
export async function testSupabaseProductsConnection(): Promise<StoreProduct[]> {
  try {
    const products = await fetchSupabaseProducts();
    console.info("[PIXO] Supabase products query succeeded", { count: products.length });
    return products;
  } catch (error) {
    console.error("[PIXO] Supabase products query failed", error);
    throw error;
  }
}

/** Authenticates an admin with Supabase Auth; mock local admin credentials are not accepted for database writes. */
export async function signInSupabaseAdmin(email: string, password: string): Promise<{ id: string; email: string; name: string }> {
  const session = await supabaseFetch<SupabaseSession>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (session.user.app_metadata?.role !== "ADMIN") {
    await supabaseFetch<void>("/auth/v1/logout", { method: "POST" }, session.access_token).catch(() => undefined);
    throw new Error("هذا الحساب غير مفعّل كمسؤول PIXO في Supabase.");
  }
  const savedSession = { ...session, expires_at: session.expires_at ?? (session.expires_in ? Math.floor(Date.now() / 1000) + session.expires_in : undefined) };
  if (typeof window !== "undefined") window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(savedSession));
  return {
    id: session.user.id,
    email: session.user.email ?? email.trim().toLowerCase(),
    name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? "مدير PIXO",
  };
}

/** Revalidates persisted Supabase admin sessions instead of trusting localStorage alone. */
export async function restoreSupabaseAdmin(): Promise<{ id: string; email: string; name: string } | null> {
  if (typeof window === "undefined") return null;
  const session = await getFreshAdminSession();
  if (!session) return null;
  try {
    const user = await supabaseFetch<SupabaseUser>("/auth/v1/user", {}, session.access_token);
    if (user.app_metadata?.role !== "ADMIN") throw new Error("Admin role required");
    const nextSession = { ...session, user };
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(nextSession));
    return { id: user.id, email: user.email ?? session.user.email ?? "", name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "مدير PIXO" };
  } catch {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
}

export async function signOutSupabaseAdmin(): Promise<void> {
  if (typeof window === "undefined") return;
  const session = readAdminSession();
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  if (session) await supabaseFetch<void>("/auth/v1/logout", { method: "POST" }, session.access_token).catch(() => undefined);
}

/** Inserts a product using the signed-in admin JWT. RLS must deny writes to anonymous users. */
export async function createSupabaseProduct(input: SupabaseNewProduct): Promise<StoreProduct> {
  const session = typeof window === "undefined" ? null : await getFreshAdminSession();
  if (!session?.access_token) throw new Error("سجّل الدخول بحساب مسؤول PIXO في Supabase لإضافة المنتجات.");

  const categoryFilter = encodeURIComponent(input.category.slug);
  const categories = await supabaseFetch<Array<{ id: string }>>(
    `/rest/v1/categories?select=id&slug=eq.${categoryFilter}&limit=1`,
    {},
    session.access_token,
  );
  if (!categories[0]) throw new Error("القسم غير موجود في قاعدة Supabase. نفّذ ملف supabase/schema.sql أولاً.");

  const images = await Promise.all(input.images.map((image) => image.startsWith("data:") ? uploadProductImage(image, session.access_token) : image));
  const rows = await supabaseFetch<SupabaseProductRow[]>("/rest/v1/products?select=id,title,description,price,compare_at_price,stock_quantity,sku,images,rating_average,is_featured,category:categories(id,name,slug)", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      title: input.title,
      slug: slugFromSku(input.sku),
      description: input.description || null,
      price: input.price,
      compare_at_price: input.compareAtPrice ?? null,
      stock_quantity: input.stockQuantity,
      sku: input.sku,
      images,
      category_id: categories[0].id,
    }),
  }, session.access_token);
  if (!rows[0]) throw new Error("لم تُرجع Supabase المنتج بعد الحفظ.");
  return mapProduct(rows[0]);
}

async function uploadProductImage(dataUrl: string, accessToken: string): Promise<string> {
  const { url, key } = requireConfig();
  const blob = await fetch(dataUrl).then((response) => response.blob());
  const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const objectPath = `${crypto.randomUUID()}.${extension}`;
  const response = await fetch(`${url}/storage/v1/object/pixo-products/${objectPath}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${accessToken}`, "Content-Type": blob.type || "image/jpeg", "x-upsert": "false" },
    body: blob,
  });
  if (!response.ok) throw new Error("تعذر رفع الصورة. تأكد من إعداد bucket وسياسات Storage في Supabase.");
  return `${url}/storage/v1/object/public/pixo-products/${objectPath}`;
}

function slugFromSku(sku: string): string {
  const slug = sku.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  // SKU is allowed to contain non-Latin characters; products.slug is required
  // and must still be unique when the SKU cannot produce an ASCII slug.
  return slug || `product-${crypto.randomUUID()}`;
}

function readAdminSession(): SupabaseSession | null {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(ADMIN_SESSION_KEY) ?? "null");
    if (!value || typeof value !== "object") return null;
    const session = value as Partial<SupabaseSession>;
    return typeof session.access_token === "string" && typeof session.refresh_token === "string" && session.user ? session as SupabaseSession : null;
  } catch { return null; }
}

async function getFreshAdminSession(): Promise<SupabaseSession | null> {
  if (typeof window === "undefined") return null;
  const session = readAdminSession();
  if (!session) return null;
  if (!session.expires_at || session.expires_at > Math.floor(Date.now() / 1000) + 30) return session;
  try {
    const refreshed = await supabaseFetch<SupabaseSession>("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    const nextSession = { ...refreshed, expires_at: refreshed.expires_at ?? (refreshed.expires_in ? Math.floor(Date.now() / 1000) + refreshed.expires_in : undefined) };
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(nextSession));
    return nextSession;
  } catch {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
}
