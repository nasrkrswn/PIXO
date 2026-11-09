"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgePercent, LayoutDashboard, LogOut, Package, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const links = [
  { href: "/admin", label: "\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629", icon: LayoutDashboard },
  { href: "/admin/products/new", label: "\u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a", icon: Package },
  { href: "/admin#orders", label: "\u0627\u0644\u0637\u0644\u0628\u0627\u062a", icon: ShoppingBag },
  { href: "/admin#promotions", label: "\u0627\u0644\u062e\u0635\u0648\u0645\u0627\u062a", icon: BadgePercent },
  { href: "/admin#sales", label: "\u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a", icon: BadgePercent },
];

export function AdminSidebar() {
  const router = useRouter();
  const { adminUser, logoutAdmin } = useAuth();
  async function signOut() { await logoutAdmin(); router.replace("/admin"); }

  return <aside className="admin-sidebar">
    <Link href="/admin" className="pixo-logo admin-logo"><span>p</span><b>PIXO</b></Link>
    <div className="admin-workspace"><span className="workspace-mark">P</span><span><b>\u0645\u062a\u062c\u0631 PIXO</b><small>\u0644\u0648\u062d\u0629 \u0627\u0644\u0623\u062f\u0645\u0646</small></span></div>
    <nav aria-label="\u0642\u0627\u0626\u0645\u0629 \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645">{links.map(({ href, label, icon: Icon }, index) => <Link href={href} key={href} className={index === 0 ? "active" : ""}><Icon size={18} />{label}</Link>)}</nav>
    <div className="sidebar-bottom"><span className="admin-avatar">{adminUser?.name.slice(0, 1) ?? "A"}</span><span><b>{adminUser?.name ?? "Admin"}</b><small>ADMIN</small></span><button type="button" onClick={signOut} aria-label="\u062a\u0633\u062c\u064a\u0644 \u062e\u0631\u0648\u062c \u0627\u0644\u0623\u062f\u0645\u0646"><LogOut size={16} /></button></div>
  </aside>;
}
