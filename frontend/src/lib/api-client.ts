import axios from "axios";
import type { ProductListResponse, ProductQuery, StoreProduct } from "@/types/product";

// Use Next.js' same-origin proxy by default to avoid browser CORS and preserve auth cookies.
const baseURL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1").replace(/\/$/, "");

/** Shared HTTP client for the PIXO REST API. Auth tokens can be attached here later. */
export const apiClient = axios.create({
  baseURL,
  timeout: 10_000,
  withCredentials: true,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

let accessToken: string | null = null;
export function setAccessToken(token: string | null) { accessToken = token; }

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export async function getProducts(query: ProductQuery = {}): Promise<ProductListResponse> {
  const path = query.q?.trim() ? "/products/search" : "/products";
  const { data } = await apiClient.get<ProductListResponse>(path, { params: query });
  return data;
}

export interface ActivePromotion {
  id: string;
  name: string;
  kind: "AUTOMATIC" | "FLASH_SALE" | "PROMO_CODE";
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "BUY_X_GET_Y";
  code: string | null;
  value: number | string;
  startDate: string;
  endDate: string;
}

export async function getActivePromotions(): Promise<ActivePromotion[]> {
  const { data } = await apiClient.get<ActivePromotion[]>("/promotions/active");
  return data;
}

/** Adapter used by admin product forms when the protected endpoint is available. */
export async function createProduct(input: NewProductInput): Promise<StoreProduct> {
  const { data } = await apiClient.post<StoreProduct>("/admin/products", input);
  return data;
}

export interface NewProductInput {
  title: string;
  description: string;
  price: number;
  stockQuantity: number;
  sku: string;
  categoryId: string;
  images: string[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "DRIVER";
  phone?: string | null;
  createdAt: string;
}

export interface AuthResponse { user: AuthUser; accessToken: string }

export async function loginRequest(email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function registerRequest(input: { name: string; email: string; password: string; phone?: string }) {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", input);
  return data;
}

export async function refreshRequest() {
  const { data } = await apiClient.post<AuthResponse>("/auth/refresh", undefined, { timeout: 4_000 });
  return data;
}
