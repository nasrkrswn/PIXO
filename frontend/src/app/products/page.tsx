import { StorefrontHome } from "@/components/storefront/storefront-home";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  return <StorefrontHome key={`${params.q ?? ""}:${params.category ?? "الكل"}`} initialQuery={params.q ?? ""} initialCategory={params.category ?? "الكل"} />;
}
