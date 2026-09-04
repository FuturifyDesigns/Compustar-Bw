-- Compustar CMS schema
create extension if not exists "pgcrypto";

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'General',
  price numeric(12,2),
  currency text not null default 'BWP',
  image_url text,
  description text default '',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.adverts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  text text not null default '',
  image_url text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_sort_idx on public.products (sort_order, created_at desc);
create index if not exists adverts_sort_idx on public.adverts (sort_order, created_at desc);

alter table public.site_content enable row level security;
alter table public.products enable row level security;
alter table public.adverts enable row level security;

drop policy if exists "Public read site_content" on public.site_content;
create policy "Public read site_content" on public.site_content for select using (true);

drop policy if exists "Auth write site_content" on public.site_content;
create policy "Auth write site_content" on public.site_content for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Public read products" on public.products;
create policy "Public read products" on public.products for select using (active = true or auth.role() = 'authenticated');

drop policy if exists "Auth write products" on public.products;
create policy "Auth write products" on public.products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Public read adverts" on public.adverts;
create policy "Public read adverts" on public.adverts for select using (active = true or auth.role() = 'authenticated');

drop policy if exists "Auth write adverts" on public.adverts;
create policy "Auth write adverts" on public.adverts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "Public read media" on storage.objects;
create policy "Public read media" on storage.objects for select using (bucket_id = 'media');

drop policy if exists "Auth upload media" on storage.objects;
create policy "Auth upload media" on storage.objects for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "Auth update media" on storage.objects;
create policy "Auth update media" on storage.objects for update using (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "Auth delete media" on storage.objects;
create policy "Auth delete media" on storage.objects for delete using (bucket_id = 'media' and auth.role() = 'authenticated');

-- Realtime so CMS edits appear on the live site immediately
do $$
begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.adverts;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.site_content;
exception when duplicate_object then null;
end $$;
