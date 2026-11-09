"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpLeft, BadgePercent, CalendarDays, CircleDollarSign, MoreHorizontal, PackagePlus, ShoppingBag, Users } from "lucide-react";
import { demoOrderStatusLabels, useMockData, type DemoOrderStatus } from "@/context/mock-data-context";
import { OrderDetailsPanel } from "@/components/admin/order-details-panel";

const money = (value: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(value);

export function AdminDashboard() {
  const { orders, products, updateOrderStatus } = useMockData();
  const [notice, setNotice] = useState("");
  const salesTotal = orders.reduce((sum, order) => sum + order.amount, 0);
  const customerCount = new Set(orders.map((order) => order.customer)).size;
  function updateStatus(id: string, status: DemoOrderStatus) {
    updateOrderStatus(id, status);
    setNotice("تم حفظ الحالة في بيانات العرض المحلية.");
    window.setTimeout(() => setNotice(""), 3500);
  }

  return <main className="admin-main">
    <div className="admin-page-title"><div><span className="eyebrow">نظرة عامة</span><h1>أهلاً بيك في لوحة PIXO</h1><p>إليك ملخص سريع لأداء متجرك اليوم.</p></div><button className="date-filter"><CalendarDays size={16} /> آخر ٣٠ يوم <MoreHorizontal size={17} /></button></div>
    <div className="admin-preview-note"><span>i</span> وضع تجريبي محلي: البيانات والتغييرات محفوظة في هذا المتصفح فقط ولا تتصل بخادم أو قاعدة بيانات.</div>
    <section className="stats-grid" aria-label="إحصائيات المتجر">
      <StatCard title="إجمالي المبيعات" value={money(salesTotal)} detail="قيمة الطلبات التجريبية" change="—" positive icon={CircleDollarSign} tone="stat-indigo" />
      <StatCard title="عدد الطلبات" value={new Intl.NumberFormat("ar-EG").format(orders.length)} detail="طلب محفوظ محلياً" change="—" positive icon={ShoppingBag} tone="stat-amber" />
      <StatCard title="العملاء" value={new Intl.NumberFormat("ar-EG").format(customerCount)} detail="في بيانات المعاينة" change="—" positive icon={Users} tone="stat-green" />
      <StatCard title="المنتجات" value={new Intl.NumberFormat("ar-EG").format(products.length)} detail="في الكتالوج المحلي" change="—" positive icon={PackagePlus} tone="stat-violet" />
    </section>

    <OrderDetailsPanel orders={orders} onStatusChange={updateStatus} />

    <section className="analytics-grid">
      <article className="admin-panel sales-panel" id="sales"><div className="panel-heading"><div><h2>نظرة على المبيعات</h2><p>رسم توضيحي لبيانات المعاينة</p></div><button className="select-filter">هذا الأسبوع</button></div><div className="sales-total"><strong>{money(salesTotal)}</strong><span className="trend-up"><ArrowUpLeft size={15} /> محلي</span><small>إجمالي قيمة الطلبات التجريبية</small></div><SalesChart /><div className="chart-days"><span>السبت</span><span>الأحد</span><span>الإثنين</span><span>الثلاثاء</span><span>الأربعاء</span><span>الخميس</span><span>الجمعة</span></div></article>
      <article className="admin-panel best-sellers"><div className="panel-heading"><div><h2>الأكثر مبيعاً</h2><p>أفضل المنتجات أداءً</p></div><Link href="/admin/products/new" className="panel-link">إضافة منتج</Link></div><div className="best-list">{[["سماعات لاسلكية", "إلكترونيات", "١٢٨", "indigo"], ["ساعة ذكية رياضية", "إلكترونيات", "٩٦", "amber"], ["مصباح مكتبي", "المنزل", "٧٤", "green"], ["حقيبة يومية", "الأزياء", "٥٨", "violet"]].map(([name, category, sold, tone], index) => <div className="best-row" key={name}><span className={`best-thumb ${tone}`}>{index + 1}</span><span className="best-product"><b>{name}</b><small>{category}</small></span><span className="best-sold">{sold}<small>مبيعاً</small></span></div>)}</div></article>
    </section>

    <section className="admin-panel orders-panel" id="orders"><div className="panel-heading"><div><h2>أحدث الطلبات</h2><p>تابع الطلبات التجريبية وحدّث حالتها</p></div><button className="panel-link" onClick={() => setNotice("كل الطلبات المعروضة محفوظة في المتصفح.")}>كل الطلبات <ArrowDownLeft size={14} /></button></div>
      {notice && <div className="admin-toast" role="status">{notice}</div>}
      <div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>رقم الطلب</th><th>العميل</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th><th><span className="sr-only">الإجراءات</span></th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><b className="order-id">{order.id}</b></td><td><span className="customer-name"><i>{order.customer.slice(0, 1)}</i>{order.customer}</span></td><td className="order-date">{order.date}</td><td className="order-amount">{money(order.amount)}</td><td><span className={`status-pill status-${order.status.toLowerCase()}`}>{demoOrderStatusLabels[order.status]}</span></td><td><select aria-label={`تغيير حالة الطلب ${order.id}`} value={order.status} onChange={(event) => updateStatus(order.id, event.target.value as DemoOrderStatus)}>{Object.entries(demoOrderStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td></tr>)}</tbody></table></div>
    </section>
    <div className="admin-footnote" id="promotions"><BadgePercent size={15} /> حملة الخصم التجريبية فعّالة محلياً فقط، وكودها لا يُطبق على دفع حقيقي.</div>
  </main>;
}

function StatCard({ title, value, detail, change, positive, icon: Icon, tone }: { title: string; value: string; detail: string; change: string; positive: boolean; icon: typeof CircleDollarSign; tone: string }) {
  return <article className="stat-card"><div className="stat-card-top"><span>{title}</span><i className={tone}><Icon size={19} /></i></div><strong className="stat-value">{value}</strong><div className="stat-foot"><span className={positive ? "trend-up" : "trend-down"}><ArrowUpLeft size={14} />{change}</span><small>{detail}</small></div></article>;
}

function SalesChart() {
  return <div className="chart-wrap"><div className="chart-y-labels"><span>١٥ ألف</span><span>١٠ آلاف</span><span>٥ آلاف</span><span>٠</span></div><svg viewBox="0 0 700 180" preserveAspectRatio="none" role="img" aria-label="رسم بياني توضيحي للمبيعات خلال الأسبوع"><defs><linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity=".19" /><stop offset="100%" stopColor="#4f46e5" stopOpacity="0" /></linearGradient></defs><path className="chart-gridline" d="M0 20H700M0 65H700M0 110H700M0 155H700" /><path d="M0 130 C45 119 52 95 100 103 S165 138 208 100 S276 91 311 75 S374 92 415 66 S480 87 516 55 S582 72 622 42 S667 49 700 19 V180 H0Z" fill="url(#salesFill)" /><path d="M0 130 C45 119 52 95 100 103 S165 138 208 100 S276 91 311 75 S374 92 415 66 S480 87 516 55 S582 72 622 42 S667 49 700 19" fill="none" stroke="#4f46e5" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg></div>;
}
