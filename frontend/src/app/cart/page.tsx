"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useMockData, type DemoPaymentMethod } from "@/context/mock-data-context";

const money = (value: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: process.env.NEXT_PUBLIC_STORE_CURRENCY ?? "EGP", maximumFractionDigits: 0 }).format(value);
const FREE_SHIPPING_THRESHOLD = 1500;
const STANDARD_SHIPPING_FEE = 60;
const paymentLabels: Record<DemoPaymentMethod, string> = { cod: "الدفع عند الاستلام", instapay: "إنستا باي (تجريبي)", vodafone_cash: "فودافون كاش (تجريبي)", visa: "بطاقة بنكية (تجريبي)", card: "بطاقة — تجربة محلية" };

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const { addOrder, promotions } = useMockData();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [orderDetails, setOrderDetails] = useState<{ id: string; name: string; payment: DemoPaymentMethod } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<DemoPaymentMethod>("cod");
  const promotion = promotions.find((item) => item.code === appliedCoupon);
  const discount = promotion ? promotion.type === "PERCENTAGE" ? Math.round(subtotal * promotion.value) / 100 : Math.min(subtotal, promotion.value) : 0;
  const shippingFee = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const total = Math.max(0, subtotal - discount) + shippingFee;

  function applyCoupon() {
    const normalized = coupon.trim().toUpperCase();
    const valid = promotions.find((item) => item.code === normalized && new Date(item.endDate).getTime() > Date.now());
    if (!valid) {
      setAppliedCoupon("");
      setCouponMessage("كود الخصم غير صالح أو انتهت صلاحيته.");
      return;
    }
    setAppliedCoupon(normalized);
    setCouponMessage(`تم تطبيق كود ${normalized}.`);
  }

  function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("customerName") ?? "").trim();
    const email = String(form.get("customerEmail") ?? user?.email ?? "").trim().toLowerCase();
    const phone = String(form.get("phone") ?? "").trim();
    const governorate = String(form.get("governorate") ?? "").trim();
    const district = String(form.get("district") ?? "").trim();
    const street = String(form.get("street") ?? "").trim();
    const deliveryNotes = String(form.get("deliveryNotes") ?? "").trim();
    const shippingAddress = [governorate, district, street, deliveryNotes].filter(Boolean).join("، ");
    const payment = String(form.get("payment") ?? "cod") as DemoPaymentMethod;
    const orderId = `PX-${Date.now().toString().slice(-6)}`;
    addOrder({
      id: orderId,
      customerId: user?.id ?? null,
      customerEmail: email,
      phone,
      shippingAddress,
      shippingFee,
      paymentMethod: payment,
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

  return <main className="cart-page store-container">
    <div className="page-heading"><div><span className="eyebrow">كل اختياراتك في مكان واحد</span><h1>عربة التسوق</h1></div><Link href="/" className="text-link">مواصلة التسوق <ArrowLeft size={15} /></Link></div>
    {orderPlaced && <div className="demo-order-success" role="status">تم حفظ طلبك في هذا المتصفح. احتفظ برقم الطلب ورقم الهاتف لتتبعه.</div>}
    {items.length === 0 ? <section className="empty-cart"><span><ShoppingBag size={32} /></span><h2>{orderPlaced ? "تم استلام طلبك" : "عربتك فارغة حالياً"}</h2><p>{orderPlaced ? "يمكنك فتح صفحة التتبع من رسالة تأكيد الطلب." : "ابدأ التسوق واكتشف المنتجات التي تناسبك."}</p><Link href={orderPlaced ? "/track-order" : "/"} className="button button-primary">{orderPlaced ? "تتبع الطلب" : "اكتشف المنتجات"}</Link></section> : (
      <form className="cart-page-layout" onSubmit={placeOrder}>
        <div className="checkout-details">
          <section className="cart-lines" aria-label="المنتجات في العربة">
            {items.map(({ product, quantity }) => <article className="cart-page-line" key={product.id}>
              <div className="cart-page-image" style={product.images[0] ? { backgroundImage: `url("${product.images[0]}")` } : undefined} />
              <div className="cart-page-info"><span>{product.category?.name ?? "اختيارات PIXO"}</span><h2>{product.title}</h2><div className="cart-price-stack"><b>{money(Number(product.price))}</b>{Number(product.compareAtPrice) > Number(product.price) && <del>{money(Number(product.compareAtPrice))}</del>}</div><div className="quantity-control"><button type="button" onClick={() => setQuantity(product.id, quantity - 1)} aria-label="تقليل الكمية"><Minus size={14} /></button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity(product.id, quantity + 1)} aria-label="زيادة الكمية" disabled={quantity >= (product.stockQuantity ?? 0)}><Plus size={14} /></button></div></div>
              <button type="button" className="remove-line" onClick={() => removeItem(product.id)} aria-label="حذف المنتج"><Trash2 size={17} /></button>
            </article>)}
          </section>
          <section className="checkout-customer-card">
            <span className="eyebrow">الخطوة الأخيرة</span><h2>بيانات التوصيل والدفع</h2>
            <div className="checkout-fields">
              <label className="checkout-field">الاسم بالكامل<input name="customerName" autoComplete="name" defaultValue={user?.name ?? ""} required minLength={2} placeholder="اكتب اسم المستلم" /></label>
              <label className="checkout-field">البريد الإلكتروني<input name="customerEmail" type="email" autoComplete="email" defaultValue={user?.email ?? ""} readOnly={Boolean(user)} required placeholder="name@example.com" /></label>
              <label className="checkout-field">رقم الهاتف<input name="phone" type="tel" autoComplete="tel" required pattern="(?:\+?20|0)?1[0125][0-9]{8}" placeholder="01xxxxxxxxx" /></label>
              <label className="checkout-field">المحافظة<select name="governorate" required defaultValue="القاهرة">{["القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "الوادي الجديد", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "مطروح", "شمال سيناء", "جنوب سيناء", "بني سويف", "كفر الشيخ", "بورسعيد", "السويس", "دمياط"].map((governorate) => <option key={governorate}>{governorate}</option>)}</select></label>
              <label className="checkout-field">المنطقة أو الحي<input name="district" required minLength={2} autoComplete="address-level2" placeholder="مثال: مدينة نصر" /></label>
              <label className="checkout-field checkout-field-wide">الشارع ورقم المبنى<input name="street" autoComplete="street-address" required minLength={5} placeholder="اسم الشارع، رقم العمارة والشقة" /></label>
              <label className="checkout-field checkout-field-wide">علامة مميزة (اختياري)<input name="deliveryNotes" placeholder="الدور أو علامة قريبة" /></label>
              <label className="checkout-field checkout-field-wide">طريقة الدفع<select name="payment" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as DemoPaymentMethod)}><option value="cod">الدفع عند الاستلام</option><option value="instapay">إنستا باي — تجريبي</option><option value="vodafone_cash">فودافون كاش — تجريبي</option><option value="visa">بطاقة بنكية — تجريبي</option></select></label>
            </div>
            <p className="checkout-demo-note">{paymentMethod === "cod" ? "الدفع عند الاستلام هو الخيار الجاهز في هذه النسخة." : `${paymentLabels[paymentMethod]} غير متصل بخدمة دفع فعلية.`} الطلبات محفوظة محلياً ولا تُرسل لشركة شحن.</p>
          </section>
        </div>
        <aside className="checkout-card"><span className="eyebrow">ملخص الطلب</span><h2>تفاصيل الطلب</h2><p><span>المنتجات ({items.reduce((count, item) => count + item.quantity, 0)})</span><b>{money(subtotal)}</b></p><div className="coupon-control"><input aria-label="كود الخصم" value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="كود الخصم" /><button type="button" onClick={applyCoupon}>تطبيق</button></div>{couponMessage && <small className={appliedCoupon ? "coupon-success" : "coupon-error"} role="status">{couponMessage}</small>}{discount > 0 && <p><span>الخصم</span><b className="coupon-success">−{money(discount)}</b></p>}<p><span>الشحن</span><b className="shipping-label">{shippingFee === 0 ? "مجاني" : money(shippingFee)}</b></p><small>{shippingFee === 0 ? "الشحن مجاني للطلبات فوق ١٬٥٠٠ ج.م" : "الشحن مجاني عند تجاوز ١٬٥٠٠ ج.م"}</small><hr /><p className="checkout-total"><span>الإجمالي</span><strong>{money(total)}</strong></p><button type="submit" className="button button-primary checkout-button">تأكيد الطلب</button><small>التأكيد تجريبي ومحفوظ في هذا المتصفح؛ لا يتم إرسال طلب فعلي.</small></aside>
      </form>
    )}
    {orderDetails && <div className="order-modal-backdrop" role="presentation"><section className="order-success-modal" role="dialog" aria-modal="true" aria-labelledby="order-success-title"><button type="button" className="order-modal-close" onClick={() => setOrderDetails(null)} aria-label="إغلاق"><X size={18} /></button><span className="order-success-icon"><Check size={30} /></span><span className="eyebrow">أهلاً بك في PIXO</span><h2 id="order-success-title">تم تسجيل طلبك!</h2><p>شكراً {orderDetails.name}، طريقة الدفع: {paymentLabels[orderDetails.payment]}. هذه نسخة تجريبية؛ لا يتم تنفيذ عملية دفع.</p><div className="order-reference"><span>رقم الطلب</span><strong dir="ltr">{orderDetails.id}</strong></div><Link href={`/orders/${orderDetails.id}`} className="button button-primary">تتبع الطلب <ArrowLeft size={16} /></Link></section></div>}
  </main>;
}
