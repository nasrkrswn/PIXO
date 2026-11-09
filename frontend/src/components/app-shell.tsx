"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CartProvider } from "@/context/cart-context";
import { StorefrontExperience } from "@/components/storefront/storefront-experience";

/** Keep the customer chrome out of the isolated admin route tree. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return children;
  return <CartProvider><StorefrontExperience>{children}</StorefrontExperience></CartProvider>;
}
