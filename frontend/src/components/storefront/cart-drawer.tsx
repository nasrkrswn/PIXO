"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/context/cart-context";

const money = (value: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: process.env.NEXT_PUBLIC_STORE_CURRENCY ?? "EGP", maximumFractionDigits: 0 }).format(value);

export function CartDrawer() {
  const { items, subtotal, isDrawerOpen, closeDrawer, setQuantity, removeItem } = useCart();
  if (!isDrawerOpen) return null;

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDrawer(); }}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div className="drawer-head"><div><span className="eyebrow">اختياراتك</span><h2 id="drawer-title">عربة التسوق <small>({items.length})</small></h2></div><button className="icon-button" onClick={closeDrawer} aria-label="إغلاق السلة"><X size={20} /></button></div>
        <div className="drawer-lines">
          {items.length === 0 ? <div className="drawer-empty"><span><ShoppingBag size={28} /></span><strong>السلة لسه فاضية</strong><p>اكتشف اختيارات PIXO وأضف اللي يعجبك.</p><button className="button button-primary" onClick={closeDrawer}>ابدأ التسوق</button></div> : items.map(({ product, quantity }) => (
            <article className="drawer-line" key={product.id}>
              <div className="line-image" style={product.images[0] ? { backgroundImage: `url("${product.images[0]}")` } : undefined} />
              <div className="line-content"><strong>{product.title}</strong><span>{money(Number(product.price))}</span><div className="quantity-control"><button onClick={() => setQuantity(product.id, quantity - 1)} aria-label="تقليل الكمية"><Minus size={13} /></button><b>{quantity}</b><button onClick={() => setQuantity(product.id, quantity + 1)} aria-label="زيادة الكمية" disabled={quantity >= product.stockQuantity}><Plus size={13} /></button></div></div>
              <button className="remove-line" onClick={() => removeItem(product.id)} aria-label="حذف المنتج"><Trash2 size={16} /></button>
            </article>
          ))}
        </div>
        {items.length > 0 && <div className="drawer-summary"><p><span>الإجمالي الفرعي</span><strong>{money(subtotal)}</strong></p><small>الشحن والخصومات تُحسب عند إتمام الطلب.</small><Link href="/cart" onClick={closeDrawer} className="button button-primary">عرض السلة وإتمام الطلب</Link></div>}
      </aside>
    </div>
  );
}
