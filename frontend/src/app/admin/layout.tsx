import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminGuard } from "@/components/admin/admin-guard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGuard><div className="admin-shell"><AdminSidebar />{children}</div></AdminGuard>;
}
