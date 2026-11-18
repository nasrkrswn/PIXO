"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoProducts } from "@/lib/demo-products";
import type { StoreProduct } from "@/types/product";

export type DemoOrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
export type DemoPaymentMethod = "cod" | "instapay" | "vodafone_cash" | "visa" | "card";

export const demoOrderStatusLabels: Record<DemoOrderStatus, string> = {
  PENDING: "\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628",
  CONFIRMED: "\u062a\u0645 \u0627\u0644\u062a\u0623\u0643\u062f \u0645\u0646 \u0627\u0644\u0637\u0644\u0628",
  PROCESSING: "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0636\u064a\u0631",
  SHIPPED: "\u062a\u0645 \u0627\u0644\u0634\u062d\u0646",
  OUT_FOR_DELIVERY: "\u0641\u064a \u0627\u0644\u0637\u0631\u064a\u0642 \u0625\u0644\u064a\u0643",
  DELIVERED: "\u062a\u0645 \u0627\u0644\u062a\u0648\u0635\u064a\u0644",
  CANCELLED: "\u0645\u0644\u063a\u064a",
};

export interface DemoOrderItem {
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  image?: string;
}

export interface DemoOrder {
  id: string;
  customerId: string | null;
  customer: string;
  customerEmail: string;
  phone: string;
  shippingAddress: string;
  paymentMethod: DemoPaymentMethod;
  items: DemoOrderItem[];
  date: string;
  amount: number;
  shippingFee?: number;
  status: DemoOrderStatus;
}

export interface DemoPromotion {
  id: string;
  name: string;
  kind: "FLASH_SALE";
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  code?: string;
  endDate: string;
}

interface MockDataValue {
  products: StoreProduct[];
  orders: DemoOrder[];
  promotions: DemoPromotion[];
  addProduct: (product: StoreProduct) => void;
  addOrder: (order: DemoOrder) => void;
  updateOrderStatus: (orderId: string, status: DemoOrderStatus) => void;
}

const STORAGE_KEY = "pixo.demo.store.v1";
const initialOrders: Array<Omit<DemoOrder, "customerId" | "customerEmail" | "phone" | "shippingAddress" | "paymentMethod" | "items">> = [
  { id: "PX-2048", customer: "\u0633\u0627\u0631\u0629 \u0645\u062d\u0645\u062f", date: "2026-11-18 10:42", amount: 2450, status: "PROCESSING" },
  { id: "PX-2047", customer: "\u0639\u0645\u0631 \u062e\u0627\u0644\u062f", date: "2026-11-18 09:18", amount: 1290, status: "PENDING" },
  { id: "PX-2046", customer: "\u0646\u0648\u0631 \u0623\u062d\u0645\u062f", date: "2026-11-17 18:53", amount: 3875, status: "SHIPPED" },
  { id: "PX-2045", customer: "\u0645\u0631\u064a\u0645 \u0639\u0644\u064a", date: "2026-11-17 16:11", amount: 875, status: "DELIVERED" },
  { id: "PX-2044", customer: "\u0643\u0631\u064a\u0645 \u062d\u0633\u0646", date: "2026-11-16 13:36", amount: 5490, status: "PROCESSING" },
];
const completeInitialOrders: DemoOrder[] = initialOrders.map((order, index) => {
  const product = demoProducts[index % demoProducts.length];
  const customerEmail = ["sara@example.com", "omar@example.com", "noor@example.com", "maryam@example.com", "karim@example.com"][index];
  return {
    ...order,
    customerId: `demo-user-${customerEmail}`,
    customerEmail,
    phone: ["01012345678", "01098765432", "01122334455", "01234567890", "01055556666"][index],
    shippingAddress: ["\u0627\u0644\u0642\u0627\u0647\u0631\u0629\u060c \u0645\u062f\u064a\u0646\u0629 \u0646\u0635\u0631", "\u0627\u0644\u062c\u064a\u0632\u0629\u060c \u0627\u0644\u062f\u0642\u064a", "\u0627\u0644\u0625\u0633\u0643\u0646\u062f\u0631\u064a\u0629\u060c \u0633\u0645\u0648\u062d\u0629", "\u0627\u0644\u0642\u0627\u0647\u0631\u0629\u060c \u0627\u0644\u0645\u0639\u0627\u062f\u064a", "\u0627\u0644\u0642\u0627\u0647\u0631\u0629\u060c \u0645\u0635\u0631 \u0627\u0644\u062c\u062f\u064a\u062f\u0629"][index],
    paymentMethod: index === 2 || index === 4 ? "card" : "cod",
    items: [{ productId: product.id, title: product.title, quantity: index === 4 ? 2 : 1, unitPrice: Math.round(order.amount / (index === 4 ? 2 : 1)), image: product.images[0] }],
  };
});

const initialPromotions: DemoPromotion[] = [{
  id: "demo-flash-sale",
  name: "\u062e\u0635\u0645 \u0641\u0644\u0627\u0634 20% \u0639\u0644\u0649 \u0627\u062e\u062a\u064a\u0627\u0631\u0627\u062a PIXO",
  kind: "FLASH_SALE",
  type: "PERCENTAGE",
  value: 20,
  code: "PIXO20",
  endDate: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
}];

const MockDataContext = createContext<MockDataValue | null>(null);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<StoreProduct[]>(demoProducts);
  const [orders, setOrders] = useState<DemoOrder[]>(completeInitialOrders);
  const [promotions, setPromotions] = useState<DemoPromotion[]>(initialPromotions);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: unknown = JSON.parse(raw);
          if (isStoredMockData(stored)) {
            const demoIds = new Set(demoProducts.map((product) => product.id));
            setProducts([...demoProducts, ...stored.products.filter((product) => !demoIds.has(product.id))]);
            setOrders(stored.orders.map(normalizeStoredOrder));
            setPromotions(stored.promotions);
          }
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (active) setHydrated(true);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function syncOrdersAcrossTabs(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const stored: unknown = JSON.parse(event.newValue);
        if (isStoredMockData(stored)) {
          const demoIds = new Set(demoProducts.map((product) => product.id));
          setProducts([...demoProducts, ...stored.products.filter((product) => !demoIds.has(product.id))]);
          setOrders(stored.orders.map(normalizeStoredOrder));
          setPromotions(stored.promotions);
        }
      } catch { /* Ignore malformed local preview data. */ }
    }
    window.addEventListener("storage", syncOrdersAcrossTabs);
    return () => window.removeEventListener("storage", syncOrdersAcrossTabs);
  }, []);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      products,
      orders,
      promotions,
    }));
  }, [hydrated, orders, products, promotions]);

  const value = useMemo<MockDataValue>(() => ({
    products,
    orders,
    promotions,
    addProduct: (product) => setProducts((current) => [product, ...current.filter((item) => item.id !== product.id)]),
    addOrder: (order) => setOrders((current) => [order, ...current]),
    updateOrderStatus: (orderId, status) => setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order)),
  }), [orders, products, promotions]);

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
}

function normalizeStoredOrder(order: DemoOrder): DemoOrder {
  return {
    ...order,
    customerId: order.customerId ?? null,
    customerEmail: order.customerEmail ?? "",
    phone: order.phone ?? "",
    shippingAddress: order.shippingAddress ?? "",
    paymentMethod: order.paymentMethod ?? "cod",
    items: Array.isArray(order.items) ? order.items : [{ productId: "legacy-order-item", title: "PIXO order item", quantity: 1, unitPrice: order.amount }],
  };
}
export function useMockData() {
  const value = useContext(MockDataContext);
  if (!value) throw new Error("useMockData must be used within MockDataProvider");
  return value;
}

function isStoredMockData(value: unknown): value is { products: StoreProduct[]; orders: DemoOrder[]; promotions: DemoPromotion[] } {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<{ products: unknown; orders: unknown; promotions: unknown }>;
  return Array.isArray(data.products) && Array.isArray(data.orders) && Array.isArray(data.promotions);
}
