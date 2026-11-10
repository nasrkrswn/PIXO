"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, ShoppingBag, UserRound } from "lucide-react";
import { useCart } from "@/context/cart-context";

const categories = ["الكل", "إلكترونيات", "المنزل", "الأزياء", "الجمال"];

export function StorefrontHeader() {
  const router = useRouter();
  const { itemCount } = useCart();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "الكل") params.set("category", category);
    router.push(`/products${params.size ? `?${params.toString()}` : ""}#products`);
  }

  return (
    <>
      <div className="topline"><span>شحن مجاني للطلبات فوق ١٬٥٠٠ ج.م</span><span>تسوّق أذكى مع PIXO</span></div>
      <header className="store-header">
        <div className="store-header-inner">
          <Link className="pixo-logo" href="/" aria-label="PIXO الصفحة الرئيسية"><span>p</span><b>PIXO</b></Link>
          <form className="header-search" onSubmit={search} role="search">
            <label className="sr-only" htmlFor="header-category">التصنيف</label>
            <select id="header-category" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بتدور على إيه النهارده؟" aria-label="ابحث عن منتج" />
            <button aria-label="بحث" type="submit"><Search size={19} /></button>
          </form>
          <Link className="orders-nav-link" href="/track-order">&#x62A;&#x62A;&#x628;&#x639; &#x637;&#x644;&#x628;&#x64A;</Link>
          <div className="header-links">
            <Link className="header-account" href="/login"><UserRound size={20} /><span><small>أهلاً بيك</small><strong>حسابي</strong></span><ChevronDown size={14} /></Link>
            <Link className="header-cart" href="/cart" aria-label="Shopping cart">
              <ShoppingBag size={22} /><span>السلة</span><b>{itemCount}</b>
            </Link>
          </div>
        </div>
        <nav className="store-nav" aria-label="التنقل الرئيسي">
          <Link href="/#categories">الأقسام</Link><Link href="/products">الأكثر مبيعاً</Link><Link href="/#flash-sales" className="sale-link">عروض فلاش</Link>
          <span className="nav-promise">توصيل سريع وآمن لكل المحافظات</span>
        </nav>
      </header>
    </>
  );
}
