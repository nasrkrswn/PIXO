"use client";

import { demoOrderStatusLabels, type DemoOrder, type DemoOrderStatus } from "@/context/mock-data-context";

const money = (value: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(value);

export function OrderDetailsPanel({ orders, onStatusChange }: { orders: DemoOrder[]; onStatusChange: (id: string, status: DemoOrderStatus) => void }) {
  return (
    <section className="admin-panel order-detail-panel" aria-labelledby="incoming-orders-title">
      <div className="panel-heading"><div><h2 id="incoming-orders-title">الطلبات الواردة وتفاصيلها</h2><p>راجع المنتجات والكميات وحدّث حالة الطلب مباشرة</p></div><span className="order-count">{new Intl.NumberFormat("ar-EG").format(orders.length)} طلب</span></div>
      {orders.length === 0 ? <p className="order-panel-empty">لا توجد طلبات حتى الآن.</p> : <div className="order-management-table-wrap">
        <table className="order-management-table">
          <thead><tr><th>رقم الطلب</th><th>العميل والتوصيل</th><th>المنتجات والكميات</th><th>الإجمالي</th><th>الحالة</th><th>تحديث الحالة</th></tr></thead>
          <tbody>{orders.map((order) => <tr key={order.id}>
            <td><b className="order-id">{order.id}</b><small>{order.date}</small></td>
            <td><b>{order.customer}</b><small dir="ltr">{order.phone}</small><small>{order.shippingAddress}</small></td>
            <td><div className="admin-order-products">{(order.items ?? []).map((item) => <span key={`${order.id}-${item.productId}`} title={item.title}>{item.title}<b>× {item.quantity}</b></span>)}</div></td>
            <td><strong>{money(order.amount)}</strong></td>
            <td><span className={`status-pill status-${order.status.toLowerCase()}`}>{demoOrderStatusLabels[order.status]}</span></td>
            <td><select aria-label={`تحديث حالة الطلب ${order.id}`} value={order.status} onChange={(event) => onStatusChange(order.id, event.target.value as DemoOrderStatus)}>{Object.entries(demoOrderStatusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>
  );
}
