"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { StoreProduct } from "@/types/product";

const STORAGE_KEY = "pixo.cart.demo.v2";

export interface CartLine {
  product: StoreProduct;
  quantity: number;
}

interface CartContextValue {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  isDrawerOpen: boolean;
  addItem: (product: StoreProduct) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: unknown = JSON.parse(raw);
          if (Array.isArray(stored) && active) setItems(stored.filter(isCartLine));
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
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + Math.round(Number(item.product.price) * 100) * item.quantity, 0) / 100;
    return {
      items,
      itemCount,
      subtotal,
      isDrawerOpen,
      addItem: (product) => {
        setItems((current) => {
          const existing = current.find((line) => line.product.id === product.id);
          if (existing) {
            return current.map((line) => line.product.id === product.id
              ? { ...line, quantity: Math.min(line.quantity + 1, product.stockQuantity) }
              : line);
          }
          return [...current, { product, quantity: 1 }];
        });
      },
      setQuantity: (productId, quantity) => setItems((current) => current.flatMap((line) => {
        if (line.product.id !== productId) return [line];
        if (quantity <= 0) return [];
        if (line.product.stockQuantity <= 0) return [];
        return [{ ...line, quantity: Math.min(quantity, line.product.stockQuantity) }];
      })),
      removeItem: (productId) => setItems((current) => current.filter((line) => line.product.id !== productId)),
      clearCart: () => setItems([]),
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    };
  }, [items, isDrawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<CartLine>;
  return Boolean(line.product?.id && Number.isInteger(line.quantity) && Number(line.quantity) > 0 && Number.isFinite(Number(line.product.price)));
}
