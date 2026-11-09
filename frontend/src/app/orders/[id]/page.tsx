"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Check, House, PackageCheck, Truck } from "lucide-react";
import { demoOrderStatusLabels, useMockData, type DemoOrderStatus } from "@/context/mock-data-context";
import { useAuth } from "@/context/auth-context";

const money = (value: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(value);
const steps: Array<{ status: DemoOrderStatus; title: string; english: string; description: string; icon: typeof Check }> = [
  { status: "PENDING", title: "\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628", english: "Order Placed", description: "\u0627\u0633\u062a\u0644\u0645\u0646\u0627 \u0637\u0644\u0628\u0643 \u0628\u0646\u062c\u0627\u062d.", icon: Check },
  { status: "CONFIRMED", title: "\u062a\u0645 \u0627\u0644\u062a\u0623\u0643\u062f \u0645\u0646 \u0627\u0644\u0637\u0644\u0628", english: "Order Confirmed", description: "\u0627\u0644\u0645\u062a\u062c\u0631 \u0623\u0643\u0651\u062f \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628.", icon: PackageCheck },
  { status: "PROCESSING", title: "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0636\u064a\u0631", english: "Preparing", description: "\u0646\u062c\u0647\u0651\u0632 \u0645\u0646\u062a\u062c\u0627\u062a\u0643 \u0644\u0644\u0634\u062d\u0646.", icon: PackageCheck },
  { status: "OUT_FOR_DELIVERY", title: "\u0641\u064a \u0627\u0644\u0637\u0631\u064a\u0642 \u0625\u0644\u064a\u0643", english: "Out for Delivery", description: "\u0627\u0644\u0645\u0646\u062f\u0648\u0628 \u0641\u064a \u0637\u0631\u064a\u0642\u0647 \u0625\u0644\u064a\u0643.", icon: Truck },
  { status: "DELIVERED", title: "\u062a\u0645 \u0627\u0644\u062a\u0648\u0635\u064a\u0644", english: "Delivered", description: "\u062a\u0645 \u062a\u0633\u0644\u064a\u0645 \u0637\u0644\u0628\u0643.", icon: Check },
];
const statusOrder: DemoOrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const { orders } = useMockData();
  const { user, loading } = useAuth();
  const foundOrder = orders.find((item) => item.id === params.id);
  const order = user && foundOrder && (foundOrder.customerId === user.id || foundOrder.customerEmail?.toLowerCase() === user.email.toLowerCase()) ? foundOrder : null;

  if (loading) return <main className="orders-page store-container"><section className="orders-empty">\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u062d\u0633\u0627\u0628\u0643...</section></main>;
  if (!user) return <main className="orders-page store-container"><section className="orders-empty"><span><PackageCheck size={27} /></span><h1>\u0633\u062c\u0651\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0639\u0631\u0636 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0637\u0644\u0628</h1><p>\u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u062d\u0633\u0627\u0628 \u0627\u0644\u0639\u0645\u064a\u0644 \u0644\u062d\u0645\u0627\u064a\u0629 \u0628\u064a\u0627\u0646\u0627\u062a\u0643.</p><Link href="/account" className="button button-primary">\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644</Link></section></main>;

  if (!order) return <main className="orders-page store-container"><Link href="/orders" className="text-link"><ArrowRight size={15} /> العودة إلى طلباتي</Link><section className="orders-empty"><span><PackageCheck size={27} /></span><h1>لم نعثر على هذا الطلب</h1><p>تحقق من رقم الطلب وحاول مرة أخرى.</p></section></main>;

  const currentStatus = order.status === "SHIPPED" ? "OUT_FOR_DELIVERY" : order.status;
  const currentStep = statusOrder.indexOf(currentStatus);
  return <main className="orders-page store-container">
    <Link href="/orders" className="text-link orders-back"><ArrowRight size={15} /> العودة إلى طلباتي</Link>
    <header className="tracking-heading"><div><span className="eyebrow">تحديثات التوصيل</span><h1>تتبع طلبك</h1><p>رقم الطلب <b dir="ltr">{order.id}</b> <span>·</span> {order.date}</p></div><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status === "CANCELLED" ? "ملغي" : demoOrderStatusLabels[currentStatus]}</span></header>
    {order.status === "CANCELLED" ? <div className="tracking-cancelled" role="status">تم إلغاء هذا الطلب. تواصل مع خدمة العملاء إذا كنت تحتاج إلى مساعدة.</div> : <section className="tracking-progress" aria-label="مراحل الطلب">
      {steps.map((step, index) => { const complete = index <= currentStep; const Icon = step.icon; return <div className={`tracking-step${complete ? " is-complete" : ""}${index === currentStep ? " is-current" : ""}`} key={step.status}><span className="tracking-step-icon"><Icon size={19} /></span><div><b>{step.title}</b><small>{step.english}</small><p>{step.description}</p></div></div>; })}
    </section>}
    <div className="tracking-layout">
      <section className="tracking-card"><div className="tracking-card-heading"><h2>المنتجات</h2><span>{new Intl.NumberFormat("ar-EG").format(order.items.reduce((sum, item) => sum + item.quantity, 0))} قطعة</span></div>
        <div className="tracking-items">{order.items.map((item) => <article className="tracking-item" key={`${order.id}-${item.productId}`}><div className="tracking-item-image" style={item.image ? { backgroundImage: `url("${item.image}")` } : undefined} /><div><h3>{item.title}</h3><p>الكمية: {item.quantity}</p></div><strong>{money(item.quantity * item.unitPrice)}</strong></article>)}</div>
        <div className="tracking-total"><span>إجمالي الطلب</span><strong>{money(order.amount)}</strong></div>
      </section>
      <aside className="tracking-card tracking-delivery"><div className="tracking-card-heading"><h2>بيانات التوصيل</h2><House size={17} /></div><b>{order.customer}</b><p dir="ltr">{order.phone || "—"}</p><p>{order.shippingAddress || "لم يضف عنوان توصيل"}</p><div className="tracking-payment"><span>طريقة الدفع</span><strong>{order.paymentMethod === "card" ? "بطاقة — محاكاة محلية" : "الدفع عند الاستلام"}</strong></div></aside>
    </div>
  </main>;
}
