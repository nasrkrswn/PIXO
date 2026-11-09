"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useMockData } from "@/context/mock-data-context";

const money = (value: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: process.env.NEXT_PUBLIC_STORE_CURRENCY ?? "EGP", maximumFractionDigits: 0 }).format(value);

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const { addOrder, promotions } = useMockData();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [orderDetails, setOrderDetails] = useState<{ id: string; name: string; payment: string } | null>(null);
  const promotion = promotions.find((item) => item.code === appliedCoupon);
  const discount = promotion ? promotion.type === "PERCENTAGE" ? Math.round(subtotal * promotion.value) / 100 : Math.min(subtotal, promotion.value) : 0;
  const total = Math.max(0, subtotal - discount);

  function applyCoupon() {
    const normalized = coupon.trim().toUpperCase();
    const valid = promotions.find((item) => item.code === normalized && new Date(item.endDate).getTime() > Date.now());
    if (!valid) {
      setAppliedCoupon("");
      setCouponMessage("الكود غير صالح في بيانات العرض التجريبية.");
      return;
    }
    setAppliedCoupon(normalized);
    setCouponMessage(`تم تطبيق كود ${normalized} محلياً.`);
  }

  function placeDemoOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("customerName") ?? "").trim();
    const email = String(form.get("customerEmail") ?? user?.email ?? "").trim().toLowerCase();
    const phone = String(form.get("phone") ?? "").trim();
    const shippingAddress = String(form.get("address") ?? "").trim();
    const payment = String(form.get("payment") ?? "cod");
    const orderId = `PX-${Date.now().toString().slice(-6)}`;
    addOrder({
      id: orderId,
      customerId: user?.id ?? null,
      customerEmail: email,
      phone,
      shippingAddress,
      paymentMethod: payment === "card" ? "card" : "cod",
      items: items.map(({ product, quantity }) => ({ productId: product.id, title: product.title, quantity, unitPrice: Number(product.price), image: product.images[0] })),
      customer: name || user?.name || "زائر PIXO",
      date: new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      amount: total,
      status: "PENDING",
    });
    clearCart();
    setOrderDetails({ id: orderId, name, payment });
    setOrderPlaced(true);
  }

  return (
    <main className="cart-page store-container">
      <div className="page-heading"><div><span className="eyebrow">كل اختياراتك في مكان واحد</span><h1>عربة التسوق</h1></div><Link href="/" className="text-link">مواصلة التسوق <ArrowLeft size={15} /></Link></div>
      {orderPlaced && <div className="demo-order-success" role="status">تم إنشاء طلب تجريبي محلياً. يمكنك مراجعته من لوحة التحكم.</div>}
      {items.length === 0 ? <section className="empty-cart"><span><ShoppingBag size={32} /></span><h2>{orderPlaced ? "تم استلام طلبك التجريبي" : "عربتك فاضية حالياً"}</h2><p>{orderPlaced ? "حُفظ الطلب في بيانات هذا المتصفح فقط." : "ابدأ جولتك واكتشف المنتجات اللي تناسبك."}</p><Link href={orderPlaced ? "/track-order" : "/"} className="button button-primary">{orderPlaced ? "تتبع الطلب" : "اكتشف المنتجات"}</Link></section> : (
        <form className="cart-page-layout" onSubmit={placeDemoOrder}>
          <div className="checkout-details">
            <section className="cart-lines" aria-label="المنتجات في العربة">
              {items.map(({ product, quantity }) => <article className="cart-page-line" key={product.id}>
                <div className="cart-page-image" style={product.images[0] ? { backgroundImage: `url("${product.images[0]}")` } : undefined} />
                <div className="cart-page-info"><span>{product.category?.name ?? "اختيارات PIXO"}</span><h2>{product.title}</h2><b>{money(Number(product.price))}</b><div className="quantity-control"><button type="button" onClick={() => setQuantity(product.id, quantity - 1)} aria-label="تقليل الكمية"><Minus size={14} /></button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity(product.id, quantity + 1)} aria-label="زيادة الكمية" disabled={quantity >= product.stockQuantity}><Plus size={14} /></button></div></div>
                <button type="button" className="remove-line" onClick={() => removeItem(product.id)} aria-label="حذف المنتج"><Trash2 size={17} /></button>
              </article>)}
            </section>
            <section className="checkout-customer-card">
              <span className="eyebrow">خطوة أخيرة</span><h2>بيانات التوصيل والدفع</h2>
              <div className="checkout-fields">
                <label className="checkout-field">الاسم بالكامل<input name="customerName" autoComplete="name" defaultValue={user?.name ?? ""} required minLength={2} placeholder="اكتب اسمك" /></label>
                <label className="checkout-field">&#x627;&#x644;&#x628;&#x631;&#x64A;&#x62F; &#x627;&#x644;&#x625;&#x644;&#x643;&#x62A;&#x631;&#x648;&#x646;&#x64A;<input name="customerEmail" type="email" autoComplete="email" defaultValue={user?.email ?? ""} readOnly={Boolean(user)} required placeholder="name@example.com" /></label>
                <label className="checkout-field">رقم الهاتف<input name="phone" type="tel" autoComplete="tel" required minLength={8} placeholder="01xxxxxxxxx" /></label>
                <label className="checkout-field checkout-field-wide">عنوان التوصيل<input name="address" autoComplete="street-address" required minLength={8} placeholder="المحافظة، المنطقة، الشارع ورقم المبنى" /></label>
                <label className="checkout-field checkout-field-wide">طريقة الدفع<select name="payment" defaultValue="cod"><option value="cod">الدفع عند الاستلام</option><option value="card">بطاقة — محاكاة دفع تجريبية</option></select></label>
              </div>
              <p className="checkout-demo-note">هذه تجربة محلية فقط؛ لن تُرسل بياناتك أو تُخصم أي مبالغ.</p>
            </section>
          </div>
          <aside className="checkout-card"><span className="eyebrow">ملخص الطلب التجريبي</span><h2>تفاصيل الطلب</h2><p><span>المنتجات ({items.reduce((count, item) => count + item.quantity, 0)})</span><b>{money(subtotal)}</b></p><div className="coupon-control"><input aria-label="كود الخصم" value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="كود الخصم" /><button type="button" onClick={applyCoupon}>تطبيق</button></div>{couponMessage && <small className={appliedCoupon ? "coupon-success" : "coupon-error"} role="status">{couponMessage}</small>}{discount > 0 && <p><span>خصم {appliedCoupon}</span><b className="coupon-success">−{money(discount)}</b></p>}<p><span>الشحن</span><b className="shipping-label">تجريبي</b></p><hr /><p className="checkout-total"><span>الإجمالي</span><strong>{money(total)}</strong></p><button type="submit" className="button button-primary checkout-button">تأكيد الطلب التجريبي</button><small>لن يتم الدفع أو إرسال الطلب إلى خادم خارجي.</small></aside>
        </form>
      )}
      {orderDetails && <div className="order-modal-backdrop" role="presentation"><section className="order-success-modal" role="dialog" aria-modal="true" aria-labelledby="order-success-title"><button type="button" className="order-modal-close" onClick={() => setOrderDetails(null)} aria-label="إغلاق"><X size={18} /></button><span className="order-success-icon"><Check size={30} /></span><span className="eyebrow">أهلاً بك في PIXO</span><h2 id="order-success-title">{orderDetails.payment === "card" ? "تمت محاكاة الدفع بنجاح!" : "تم تأكيد طلبك!"}</h2><p>شكراً {orderDetails.name}، طلبك التجريبي جاهز. هذه التجربة محلية بالكامل ولا يوجد دفع حقيقي.</p><div className="order-reference"><span>رقم الطلب</span><strong dir="ltr">{orderDetails.id}</strong></div><Link href={`/orders/${orderDetails.id}`} className="button button-primary">&#x62A;&#x62A;&#x628;&#x639; &#x627;&#x644;&#x637;&#x644;&#x628; <ArrowLeft size={16} /></Link></section></div>}
    </main>
  );
}
