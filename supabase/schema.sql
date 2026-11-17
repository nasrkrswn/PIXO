-- PIXO's client-facing Supabase catalog. Run this in Supabase SQL Editor.
-- The browser uses only the publishable key. RLS protects all catalog writes.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  compare_at_price numeric(12, 2) check (compare_at_price is null or compare_at_price >= price),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sku text not null unique,
  images text[] not null default '{}',
  category_id uuid references public.categories(id) on delete set null,
  rating_average numeric(3, 2) not null default 0 check (rating_average between 0 and 5),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_created_at_idx on public.products(created_at desc);

insert into public.categories (name, slug) values
  ('إلكترونيات', 'electronics'),
  ('المنزل', 'home'),
  ('الأزياء', 'fashion'),
  ('الجمال', 'beauty')
on conflict (slug) do update set name = excluded.name;

alter table public.categories enable row level security;
alter table public.products enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "Anyone can read categories" on public.categories;
create policy "Anyone can read categories" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products" on public.products
  for select to anon, authenticated using (true);

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products" on public.products
  for insert to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products" on public.products
  for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products" on public.products
  for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

insert into storage.buckets (id, name, public)
values ('pixo-products', 'pixo-products', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can view PIXO product images" on storage.objects;
create policy "Anyone can view PIXO product images" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'pixo-products');

drop policy if exists "Admins can upload PIXO product images" on storage.objects;
create policy "Admins can upload PIXO product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pixo-products' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

drop policy if exists "Admins can update PIXO product images" on storage.objects;
create policy "Admins can update PIXO product images" on storage.objects
  for update to authenticated
  using (bucket_id = 'pixo-products' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
  with check (bucket_id = 'pixo-products' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

drop policy if exists "Admins can delete PIXO product images" on storage.objects;
create policy "Admins can delete PIXO product images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pixo-products' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

create or replace function public.set_product_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_product_updated_at();

-- After creating an admin user in Supabase Authentication, grant the role from SQL Editor:
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"ADMIN"}'::jsonb
-- where email = 'your-admin-email@example.com';
