-- Profiles, order requests, and service galleries
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text default '',
  phone text default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_images (
  id uuid primary key default gen_random_uuid(),
  service_slug text not null,
  image_url text not null,
  caption text default '',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  fulfillment text not null check (fulfillment in ('pickup', 'delivery')),
  pickup_when text default '',
  delivery_address text default '',
  notes text default '',
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  items jsonb not null default '[]'::jsonb,
  whatsapp_share_url text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_images_slug_idx on public.service_images (service_slug, sort_order);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

alter table public.profiles enable row level security;
alter table public.service_images enable row level security;
alter table public.orders enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when lower(coalesce(new.email, '')) = 'compustarbw@gmail.com' then 'admin'
      else 'customer'
    end
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "Public read service images" on public.service_images;
create policy "Public read service images" on public.service_images
  for select using (active = true or public.is_admin());

drop policy if exists "Admin write service images" on public.service_images;
create policy "Admin write service images" on public.service_images
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Anyone insert orders" on public.orders;
create policy "Anyone insert orders" on public.orders
  for insert with check (true);

drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders" on public.orders
  for select using (
    public.is_admin()
    or (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and false)
  );

drop policy if exists "Admin update orders" on public.orders;
create policy "Admin update orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- Keep CMS write policies admin-only going forward
drop policy if exists "Auth write site_content" on public.site_content;
create policy "Admin write site_content" on public.site_content
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Auth write products" on public.products;
create policy "Admin write products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Auth write adverts" on public.adverts;
create policy "Admin write adverts" on public.adverts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Auth upload media" on storage.objects;
create policy "Admin upload media" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Auth update media" on storage.objects;
create policy "Admin update media" on storage.objects
  for update using (bucket_id = 'media' and public.is_admin());

drop policy if exists "Auth delete media" on storage.objects;
create policy "Admin delete media" on storage.objects
  for delete using (bucket_id = 'media' and public.is_admin());

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.service_images;
exception when duplicate_object then null;
end $$;

-- Promote existing Compustar admin account if present
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where lower(email) = 'compustarbw@gmail.com'
on conflict (id) do update set role = 'admin', email = excluded.email, updated_at = now();
