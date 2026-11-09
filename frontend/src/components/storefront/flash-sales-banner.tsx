"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { useMockData } from "@/context/mock-data-context";

export function FlashSalesBanner() {
  const { promotions } = useMockData();
  const promotion = promotions.find((item) => item.kind === "FLASH_SALE") ?? null;
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!promotion) return;
    let interval = 0;
    const update = () => setRemaining(Math.max(0, Math.floor((new Date(promotion.endDate).getTime() - Date.now()) / 1000)));
    const timeout = window.setTimeout(() => {
      update();
      interval = window.setInterval(update, 1000);
    }, 0);
    return () => { window.clearTimeout(timeout); window.clearInterval(interval); };
  }, [promotion]);

  const active = Boolean(promotion && remaining > 0);
  const hours = String(Math.floor(remaining / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  const offer = promotion?.type === "PERCENTAGE" ? `${promotion.value}٪ خصم` : `${Number(promotion?.value ?? 0).toLocaleString("ar-EG")} ج.م خصم`;

  return <section className="flash-banner" id="flash-sales">
    <div className="flash-icon"><Zap size={24} fill="currentColor" /></div>
    <div className="flash-copy"><span>{active ? "عرض فلاش تجريبي" : "وقت العروض"}</span><h2>{active ? promotion?.name : "عروض فلاش بتتجدد على اختيارات PIXO"}</h2><p>{active ? `${offer} — كود ${promotion?.code}` : "حملة محلية للتجربة، بدون خصم فعلي على الدفع."}</p></div>
    <div className="flash-side">{active ? <><small>ينتهي خلال</small><strong className="countdown" dir="ltr">{hours}:{minutes}:{seconds}</strong></> : <><small>وضع العرض</small><strong>تجريبي</strong></>}<Link href="/admin#promotions">إدارة العروض <ArrowLeft size={14} /></Link></div>
    <span className="flash-watermark">FLASH</span>
  </section>;
}
