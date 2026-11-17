"use client";

import { useState } from "react";
import { testSupabaseProductsConnection } from "@/lib/supabase";

export function SupabaseConnectionCheck() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("اضغط الزر لإرسال استعلام قراءة إلى جدول products.");

  async function checkConnection() {
    setStatus("loading");
    setMessage("جارٍ الاتصال بـ Supabase...");
    try {
      const products = await testSupabaseProductsConnection();
      setStatus("success");
      setMessage(`نجح الاتصال. عدد المنتجات المسترجعة: ${products.length}. افتح Console لمشاهدة البيانات.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "فشل الاتصال. راجع Console وإعدادات Supabase.");
    }
  }

  return (
    <main className="store-container" style={{ maxWidth: 760, paddingBlock: 60 }}>
      <section className="checkout-customer-card" aria-labelledby="supabase-check-title">
        <span className="eyebrow">PIXO · فحص التطوير</span>
        <h1 id="supabase-check-title">اختبار اتصال Supabase</h1>
        <p>يستخدم الاختبار متغيرات البيئة الحالية ويجلب صفوف المنتجات المسموح بقراءتها.</p>
        <button className="button button-primary" onClick={checkConnection} disabled={status === "loading"}>
          {status === "loading" ? "جارٍ الاختبار..." : "اختبر الاتصال واجلب المنتجات"}
        </button>
        <p role="status" aria-live="polite" style={{ color: status === "error" ? "#c24135" : status === "success" ? "#17804d" : undefined }}>
          {message}
        </p>
        <small>يُعرض عدد المنتجات فقط ولا تُطبع بيانات الكتالوج في Console.</small>
      </section>
    </main>
  );
}
