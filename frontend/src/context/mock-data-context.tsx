"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoProducts } from "@/lib/demo-products";
import type { StoreProduct } from "@/types/product";

export type DemoOrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

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
  paymentMethod: "cod" | "card";
  items: DemoOrderItem[];
  date: string;
  amount: number;
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
  { id: "PX-2048", customer: "سارة محمد", date: "اليوم، ١٠:٤٢ ص", amount: 2450, status: "PROCESSING" },
  { id: "PX-2047", customer: "عمر خالد", date: "اليوم، ٩:١٨ ص", amount: 1290, status: "PENDING" },
  { id: "PX-2046", customer: "نور أحمد", date: "أمس، ٦:٥٣ م", amount: 3875, status: "SHIPPED" },
  { id: "PX-2045", customer: "مريم علي", date: "أمس، ٤:١١ م", amount: 875, status: "DELIVERED" },
  { id: "PX-2044", customer: "كريم حسن", date: "١٨ مايو، ١:٣٦ م", amount: 5490, status: "PROCESSING" },
];
const completeInitialOrders: DemoOrder[] = initialOrders.map((order, index) => {
  const product = demoProducts[index % demoProducts.length];
  const customerEmail = ["sara@example.com", "omar@example.com", "noor@example.com", "maryam@example.com", "karim@example.com"][index];
  return {
    ...order,
    customerId: `demo-user-${customerEmail}`,
    customerEmail,
    phone: ["01012345678", "01098765432", "01122334455", "01234567890", "01055556666"][index],
    shippingAddress: ["القاهرة، مدينة نصر", "الجيزة، الدقي", "الإسكندرية، سموحة", "القاهرة، المعادي", "القاهرة، مصر الجديدة"][index],
    paymentMethod: index === 2 || index === 4 ? "card" : "cod",
    items: [{ productId: product.id, title: product.title, quantity: index === 4 ? 2 : 1, unitPrice: Math.round(order.amount / (index === 4 ? 2 : 1)), image: product.images[0] }],
  };
});

const initialPromotions: DemoPromotion[] = [{
  id: "demo-flash-sale",
  name: "خصم فلاش ٢٠٪ على اختيارات PIXO",
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
          if (isStoredMockData(stored) && active) {
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
        if (isStoredMockData(stored)) setOrders(stored.orders.map(normalizeStoredOrder));
      } catch { /* Ignore malformed local preview data. */ }
    }
    window.addEventListener("storage", syncOrdersAcrossTabs);
    return () => window.removeEventListener("storage", syncOrdersAcrossTabs);
  }, []);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, orders, promotions }));
  }, [hydrated, orders, products, promotions]);

  const value = useMemo<MockDataValue>(() => ({
    products,
    orders,
    promotions,
    addProduct: (product) => setProducts((current) => [product, ...current]),
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
