import { notFound } from "next/navigation";
import { SupabaseConnectionCheck } from "@/components/supabase-connection-check";

/** Keep the diagnostics page out of production deployments. */
export default function SupabaseCheckPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SupabaseConnectionCheck />;
}
