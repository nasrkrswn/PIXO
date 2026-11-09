import type { Metadata } from "next";
import { AuthProvider } from "@/context/auth-context";
import { MockDataProvider } from "@/context/mock-data-context";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "PIXO | بيكسو — تسوّق بذكاء",
  description: "اكتشف منتجات PIXO المختارة، عروض متجددة وتجربة تسوق سهلة.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <body><MockDataProvider><AuthProvider><AppShell>{children}</AppShell></AuthProvider></MockDataProvider></body>
    </html>
  );
}
