"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Check, House, PackageCheck, Truck } from "lucide-react";
import { demoOrderStatusLabels, useMockData, type DemoOrderStatus, type DemoPaymentMethod } from "@/context/mock-data-context";
import { useAuth } from "@/context/auth-context";

const money = (value: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(value);
const steps: Array<{ status: DemoOrderStatus; title: string; english: string; description: string; icon: typeof Check }> = [
  { status: "PENDING", title: "تم استلام الطلب", english: "Order Placed", description: "استلمنا طلبك بنجاح.", icon: Check },
  { status: "CONFIRMED", title: "تم تأكيد الطلب", english: "Order Confirmed", description: "المتجر أكد استلام الطلب.", icon: PackageCheck },
  { status: "PROCESSING", title: "جارٍ التحضير", english: "Preparing", description: "نجهز منتجاتك للتوصيل.", icon: PackageCheck },
  { status: "OUT_FOR_DELIVERY", title: "في الطريق إليك", english: "Out for Delivery", description: "المندوب في طريقه إليك.", icon: Truck },
  { status: "DELIVERED", title: "تم التوصيل", english: "Delivered", description: "تم تسليم طلبك.", icon: Check },
];
const statusOrder: DemoOrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED"];
const paymentLabels: Record<DemoPaymentMethod, string> = { cod: "الدفع عند الاستلام", instapay: "إنستا باي", vodafone_cash: "فودافون كاش", visa: "فيزا / بطاقة بنكية", card: "بطاقة — تجربة محلية" };

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const [guestPhone, setGuestPhone] = useState("");
  const [verifiedGuestOrderId, setVerifiedGuestOrderId] = useState("");
  const { orders } = useMockData();
  const { user, loading } = useAuth();
  const foundOrder = orders.find((item) => item.id === params.id);
  const isAccountOrder = Boolean(user && foundOrder && (foundOrder.customerId === user.id || foundOrder.customerEmail?.toLowerCase() === user.email.toLowerCase()));
  const isVerifiedGuestOrder = Boolean(foundOrder && foundOrder.customerId === null && verifiedGuestOrderId === foundOrder.id && guestPhone.replace(/\D/g, "") === foundOrder.phone.replace(/\D/g, ""));
  const order = isAccountOrder || isVerifiedGuestOrder ? foundOrder : null;

  if (loading) return <main className="orders-page store-container"><section className="orders-empty">جارٍ التحقق من حسابك...</section></main>;

  if (foundOrder && foundOrder.customerId === null && !order) {
    function verifyGuestOrder(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setVerifiedGuestOrderId(foundOrder.id);
    }
    return <main className="orders-page store-container"><Link href="/track-order" className="text-link orders-back"><ArrowRight size={15} /> العودة لتتبع الطلبات</Link><section className="orders-empty"><span><PackageCheck size={27} /></span><h1>تأكيد بيانات التوصيل</h1><p>اكتب رقم الهاتف الذي سجلته عند الطلب لعرض حالة التوصيل.</p><form className="admin-login-form" onSubmit={verifyGuestOrder}><label className="field-label">رقم الهاتف<input type="tel" required minLength={8} value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} autoComplete="tel" dir="ltr" /></label><button className="button button-primary auth-submit" type="submit">عرض حالة الطلب</button>{verifiedGuestOrderId === foundOrder.id && <small className="form-error">رقم الهاتف غير مطابق لبيانات الطلب.</small>}</form></section></main>;
  }

  if (!order) return <main className="orders-page store-container"><Link href="/track-order" className="text-link"><ArrowRight size={15} /> العودة لتتبع الطلبات</Link><section className="orders-empty"><span><PackageCheck size={27} /></span><h1>لم نعثر على هذا الطلب</h1><p>تحقق من رقم الطلب أو سجّل الدخول بالحساب المرتبط به.</p><Link href="/login" className="button button-primary">تسجيل الدخول</Link></section></main>;

  const currentStatus = order.status === "SHIPPED" ? "OUT_FOR_DELIVERY" : order.status;
  const currentStep = statusOrder.indexOf(currentStatus);
  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const shippingFee = order.shippingFee ?? Math.max(0, order.amount - itemsSubtotal);
  return <main className="orders-page store-container">
    <Link href="/track-order" className="text-link orders-back"><ArrowRight size={15} /> العودة لتتبع الطلبات</Link>
    <header className="tracking-heading"><div><span className="eyebrow">تحديثات التوصيل</span><h1>تتبع طلبك</h1><p>رقم الطلب <b dir="ltr">{order.id}</b> <span>·</span> {order.date}</p></div><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status === "CANCELLED" ? "ملغي" : demoOrderStatusLabels[currentStatus]}</span></header>
    {order.status === "CANCELLED" ? <div className="tracking-cancelled" role="status">تم إلغاء هذا الطلب. تواصل مع خدمة العملاء إذا كنت تحتاج إلى مساعدة.</div> : <section className="tracking-progress" aria-label="مراحل الطلب">
      {steps.map((step, index) => { const complete = index <= currentStep; const Icon = step.icon; return <div className={`tracking-step${complete ? " is-complete" : ""}${index === currentStep ? " is-current" : ""}`} key={step.status}><span className="tracking-step-icon"><Icon size={19} /></span><div><b>{step.title}</b><small>{step.english}</small><p>{step.description}</p></div></div>; })}
    </section>}
    <div className="tracking-layout">
      <section className="tracking-card"><div className="tracking-card-heading"><h2>المنتجات</h2><span>{new Intl.NumberFormat("ar-EG").format(order.items.reduce((sum, item) => sum + item.quantity, 0))} قطع</span></div>
        <div className="tracking-items">{order.items.map((item) => <article className="tracking-item" key={`${order.id}-${item.productId}`}><div className="tracking-item-image" style={item.image ? { backgroundImage: `url("${item.image}")` } : undefined} /><div><h3>{item.title}</h3><p>الكمية: {item.quantity}</p></div><strong>{money(item.quantity * item.unitPrice)}</strong></article>)}</div>
        <div className="tracking-total"><span>المنتجات</span><strong>{money(itemsSubtotal)}</strong></div><div className="tracking-total"><span>الشحن</span><strong>{shippingFee ? money(shippingFee) : "مجاني"}</strong></div><div className="tracking-total"><span>إجمالي الطلب</span><strong>{money(order.amount)}</strong></div>
      </section>
      <aside className="tracking-card tracking-delivery"><div className="tracking-card-heading"><h2>بيانات التوصيل</h2><House size={17} /></div><b>{order.customer}</b><p dir="ltr">{order.phone || "—"}</p><p>{order.shippingAddress || "لم يُضف عنوان توصيل"}</p><div className="tracking-payment"><span>طريقة الدفع</span><strong>{paymentLabels[order.paymentMethod]}</strong></div></aside>
    </div>
  </main>;
}
