import type { OrderStatus, PaymentStatus, Role } from "../generated/prisma/client.js";

/** User fields safe to return from public API endpoints. */
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  createdAt: string;
}

/** Public product representation; Decimal values are serialized as strings. */
export interface ProductResponse {
  id: string;
  title: string;
  description: string | null;
  price: string;
  stockQuantity: number;
  sku: string;
  images: string[];
  categoryId: string | null;
  ratingAverage: string;
  isFeatured: boolean;
}

/** A cart line with its calculated line total. */
export interface CartItemResponse {
  id: string;
  productId: string;
  title: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

/** Customer cart view. Totals must be recomputed before checkout. */
export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  totalAmount: string;
}

/** Customer-safe order summary. */
export interface OrderResponse {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: string;
  discountApplied: string;
  totalAmount: string;
  currency: string;
  deliveryDate: string | null;
  createdAt: string;
}
