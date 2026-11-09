"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { demoOrderStatusLabels, useMockData } from "@/context/mock-data-context";

const money = (value: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(value);

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [lookup, setLookup] = useState("");
  const { user, loading } = useAuth();
  const { orders } = useMockData();
  const myOrders = user ? orders.filter((order) => order.customerId === user.id || order.customerEmail?.toLowerCase() === user.email.toLowerCase()) : [];
  const activeMockOrders = myOrders.filter((order) => order.status !== "DELIVERED" && order.status !== "CANCELLED");
  function findOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = lookup.trim();
    if (id) router.push(`/orders/${encodeURIComponent(id)}`);
  }

  return <main className="orders-page store-container">
    <div className="page-heading"><div><span className="eyebrow">حساب PIXO</span><h1>طلباتي</h1><p>تابع حالة طلباتك وتفاصيل التوصيل.</p></div></div>
    <form className="order-lookup-form" onSubmit={findOrder}><label htmlFor="order-lookup">لديك رقم طلب؟ أدخله للتتبع</label><div><select aria-label="Select an active mock order" defaultValue="" onChange={(event) => { const id = event.target.value; if (id) router.push(`/orders/${encodeURIComponent(id)}`); }}><option value="">&#x627;&#x62E;&#x62A;&#x631; &#x637;&#x644;&#x628;&#x627;&#x64B; &#x646;&#x634;&#x637;&#x627;&#x64B;</option>{activeMockOrders.map((order) => <option key={order.id} value={order.id}>{order.id} — {demoOrderStatusLabels[order.status]}</option>)}</select><input id="order-lookup" value={lookup} onChange={(event) => setLookup(event.target.value)} placeholder="مثال: PX-2048" required /><button className="button button-primary" type="submit">تتبع الطلب <ArrowLeft size={14} /></button></div></form>
    {loading ? <div className="orders-empty">جارٍ تحميل طلباتك...</div> : !user ? <section className="orders-empty"><span><PackageCheck size={27} /></span><h2>سجّل الدخول لمراجعة طلباتك</h2><p>بعد تسجيل الدخول ستظهر هنا الطلبات المرتبطة ببريدك الإلكتروني.</p><Link href="/login" className="button button-primary">تسجيل الدخول <ArrowLeft size={15} /></Link></section> : myOrders.length === 0 ? <section className="orders-empty"><span><PackageCheck size={27} /></span><h2>لا توجد طلبات مرتبطة بحسابك بعد</h2><p>بعد إتمام طلبك، ستجد تفاصيله وحالته هنا.</p><Link href="/" className="button button-primary">ابدأ التسوق <ArrowLeft size={15} /></Link></section> : <div className="customer-order-list">
      {myOrders.map((order) => <article className="customer-order-card" key={order.id}>
        <div className="customer-order-top"><div><span>رقم الطلب</span><b dir="ltr">{order.id}</b></div><span className={`status-pill status-${order.status.toLowerCase()}`}>{demoOrderStatusLabels[order.status]}</span></div>
        <p className="customer-order-date">تاريخ الطلب: {order.date}</p>
        <div className="customer-order-items">{order.items.map((item) => <div key={`${order.id}-${item.productId}`}><span>{item.title} <b>× {item.quantity}</b></span><strong>{money(item.quantity * item.unitPrice)}</strong></div>)}</div>
        <div className="customer-order-bottom"><b>الإجمالي <strong>{money(order.amount)}</strong></b><Link href={`/orders/${order.id}`} className="text-link">تتبع الطلب <ArrowLeft size={14} /></Link></div>
      </article>)}
    </div>}
  </main>;
}
