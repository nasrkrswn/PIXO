"use client";

import { useState } from "react";
import { Check, Heart, House, Laptop, ShoppingCart, Sparkles, Star, Watch } from "lucide-react";
import { useCart } from "@/context/cart-context";
import type { StoreProduct } from "@/types/product";

const money = (value: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: process.env.NEXT_PUBLIC_STORE_CURRENCY ?? "EGP", maximumFractionDigits: 0 }).format(value);

export function ProductCard({ product }: { product: StoreProduct }) {
  const { addItem, openDrawer } = useCart();
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const CategoryIcon = product.category?.name === "المنزل" ? House : product.category?.name === "الأزياء" ? Watch : product.category?.name === "الجمال" ? Sparkles : Laptop;

  function addToCart() {
    addItem(product);
    setAdded(true);
    openDrawer();
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="product-card">
      <div className={`product-card-image${product.images[0] ? "" : " product-card-placeholder"}`} style={product.images[0] ? { backgroundImage: `url("${product.images[0]}")` } : undefined}>
        {product.isFeatured && <span className="product-badge">اختيار PIXO</span>}
        <button className={`favorite-button${saved ? " is-saved" : ""}`} onClick={() => setSaved((value) => !value)} aria-label={saved ? "إزالة من المفضلة" : "أضف للمفضلة"}><Heart size={17} fill={saved ? "currentColor" : "none"} /></button>
        {!product.images[0] && <span className="image-placeholder"><CategoryIcon size={48} strokeWidth={1.2} /><b>PIXO</b></span>}
      </div>
      <div className="product-card-body">
        <span className="product-category">{product.category?.name ?? "اختيارات PIXO"}</span>
        <h3>{product.title}</h3>
        {product.description && <p className="product-description">{product.description}</p>}
        <div className="product-rating"><Star size={14} fill="currentColor" /><b>{Number(product.ratingAverage || 0).toFixed(1)}</b><span>تقييم العملاء</span></div>
        <div className="product-price-row"><strong>{money(Number(product.price))}</strong><span className={product.stockQuantity ? "stock-in" : "stock-out"}>{product.stockQuantity ? "متوفر" : "نفد"}</span></div>
        <button className="button button-add" onClick={addToCart} disabled={product.stockQuantity <= 0}>{added ? <Check size={17} /> : <ShoppingCart size={17} />}{added ? "أُضيف للسلة" : "أضف إلى السلة"}</button>
      </div>
    </article>
  );
}
