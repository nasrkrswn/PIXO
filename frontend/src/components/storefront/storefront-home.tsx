"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Headphones, House, Laptop, Search, ShieldCheck, Sparkles, Truck, Watch, Zap } from "lucide-react";
import { useMockData } from "@/context/mock-data-context";
import { ProductCard } from "@/components/storefront/product-card";
import { FlashSalesBanner } from "@/components/storefront/flash-sales-banner";

const categories = [
  { name: "إلكترونيات", subtitle: "تقنية ليوم أسهل", icon: Laptop, tone: "category-indigo" },
  { name: "المنزل", subtitle: "تفاصيل تفرق", icon: House, tone: "category-amber" },
  { name: "الأزياء", subtitle: "ستايلك بطريقتك", icon: Watch, tone: "category-rose" },
  { name: "الجمال", subtitle: "وقت لنفسك", icon: Sparkles, tone: "category-green" },
];

const slides = [
  { kicker: "كل يوم اكتشاف جديد", title: <>كل اللي بتحبه،<br /><em>في مكان واحد.</em></>, body: "اختيارات ذكية، جودة تثق فيها، وتجربة تسوّق أسهل.", art: "hero-art-indigo" },
  { kicker: "اختيارات معمولة ليك", title: <>خلّي يومك<br /><em>أبسط وأجمل.</em></>, body: "من تفاصيل البيت لأحدث التقنيات، اكتشف مجموعتنا الجديدة.", art: "hero-art-amber" },
  { kicker: "التوصيل علينا", title: <>اختار براحتك،<br /><em>وإحنا نوصل لبابك.</em></>, body: "رحلة تسوّق سلسة من أول نقرة لحد استلام طلبك.", art: "hero-art-violet" },
];

export function StorefrontHome({ initialQuery, initialCategory }: { initialQuery: string; initialCategory: string }) {
  const { products } = useMockData();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [slide, setSlide] = useState(0);
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % slides.length), 5500);
    return () => window.clearInterval(timer);
  }, []);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
    const matchesCategory = category === "الكل" || product.category?.name === category;
    const normalizedQuery = query.trim().toLocaleLowerCase("ar");
    const matchesSearch = !normalizedQuery || `${product.title} ${product.description ?? ""}`.toLocaleLowerCase("ar").includes(normalizedQuery);
    return matchesCategory && matchesSearch;
    });
    if (sort === "price-asc") return [...filtered].sort((left, right) => Number(left.price) - Number(right.price));
    if (sort === "price-desc") return [...filtered].sort((left, right) => Number(right.price) - Number(left.price));
    if (sort === "rating") return [...filtered].sort((left, right) => Number(right.ratingAverage) - Number(left.ratingAverage));
    return filtered;
  }, [category, products, query, sort]);

  return (
    <main className="store-main">
      <div className="preview-bar"><span /> وضع تجريبي محلي — تغييرات المنتجات والطلبات محفوظة في هذا المتصفح فقط.</div>
      <div className="store-container">
        <section className={`hero-carousel ${slides[slide].art}`} aria-label="عروض PIXO">
          <div className="hero-copy" key={slide}>
            <span className="hero-kicker"><Sparkles size={15} />{slides[slide].kicker}</span>
            <h1>{slides[slide].title}</h1>
            <p>{slides[slide].body}</p>
            <a href="#products" className="button button-primary hero-cta">اكتشف المنتجات <ArrowLeft size={17} /></a>
            <div className="hero-trust"><span><ShieldCheck size={15} /> تسوق موثوق</span><span><Truck size={15} /> توصيل لباب البيت</span></div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-orbit orbit-back" /><div className="hero-orbit orbit-front" />
            <div className="hero-product hero-product-large"><Headphones size={92} strokeWidth={1.25} /></div>
            <div className="hero-product hero-product-mini"><Watch size={38} strokeWidth={1.3} /></div>
            <div className="hero-deal"><Zap size={16} fill="currentColor" /><span>اختيارات<br /><b>PIXO</b></span></div>
            <span className="hero-star star-a">✦</span><span className="hero-star star-b">✧</span>
          </div>
          <div className="hero-dots" role="tablist" aria-label="شرائح الإعلان">
            {slides.map((item, index) => <button key={item.kicker} className={slide === index ? "active" : ""} onClick={() => setSlide(index)} aria-label={`الشريحة ${index + 1}`} aria-selected={slide === index} role="tab" />)}
          </div>
        </section>

        <section className="benefit-strip" aria-label="مميزات PIXO">
          <div><span><Truck size={19} /></span><p><b>توصيل سريع</b><small>لحد باب بيتك</small></p></div>
          <div><span><ShieldCheck size={19} /></span><p><b>تسوق مطمئن</b><small>اختيارات موثوقة</small></p></div>
          <div><span><ArrowUpLeft size={19} /></span><p><b>استرجاع سهل</b><small>سياسة واضحة</small></p></div>
          <div><span><Headphones size={19} /></span><p><b>دايماً معاك</b><small>دعم يساعدك</small></p></div>
        </section>

        <section className="section-block" id="categories">
          <div className="section-title"><div><span className="eyebrow">اختار اللي يناسبك</span><h2>تسوّق حسب القسم</h2></div><a href="#products" className="text-link">كل المنتجات <ArrowLeft size={15} /></a></div>
          <div className="category-grid">
            {categories.map(({ name, subtitle, icon: Icon, tone }) => <button key={name} onClick={() => { setCategory(name); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }} className={`category-tile ${tone}`}><span className="category-icon"><Icon size={24} /></span><span><b>{name}</b><small>{subtitle}</small></span><ArrowUpLeft className="category-arrow" size={17} /></button>)}
          </div>
        </section>

        <FlashSalesBanner />

        <section className="section-block product-section" id="products">
          <div className="section-title product-title"><div><span className="eyebrow">منتجات تستاهل تجربها</span><h2>{query ? `نتائج البحث عن «${query}»` : category === "الكل" ? "الأكثر تميزاً من PIXO" : `تسوّق ${category}`}</h2><p className="section-caption">اختياراتنا المفضلة من أجلك</p></div><div className="product-tools"><span className="api-state"><i />بيانات محلية تجريبية</span><label className="store-sort">ترتيب<select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="featured">الأكثر تميزاً</option><option value="price-asc">السعر: الأقل أولاً</option><option value="price-desc">السعر: الأعلى أولاً</option><option value="rating">الأعلى تقييماً</option></select></label></div></div>
          <div className="filter-chips" aria-label="فلترة حسب القسم">{["الكل", ...categories.map((item) => item.name)].map((name) => <button key={name} className={category === name ? "selected" : ""} onClick={() => setCategory(name)}>{name}</button>)}</div>
          {visibleProducts.length ? <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-products"><SearchIcon /><strong>ملقيناش منتجات في القسم ده</strong><span>جرّب قسم تاني أو ارجع لكل المنتجات.</span><button onClick={() => setCategory("الكل")}>عرض كل المنتجات</button></div>}
          <div className="show-more-row"><span>عرض {visibleProducts.length} منتج</span><button onClick={() => { setQuery(""); setCategory("الكل"); }}>عرض الكل <ArrowLeft size={15} /></button></div>
        </section>
      </div>
      <footer className="store-footer"><div className="store-container footer-inner"><Link className="pixo-logo footer-logo" href="/"><span>p</span><b>PIXO</b></Link><p>تجربة تسوق أسهل، كل يوم.</p><small>© PIXO 2026 — جميع الحقوق محفوظة</small></div></footer>
    </main>
  );
}

function SearchIcon() { return <Search size={29} />; }
