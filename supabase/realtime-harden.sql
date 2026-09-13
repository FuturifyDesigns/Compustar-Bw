-- Ensure CMS + orders update live clients without refresh
-- Realtime + RLS works best with FULL replica identity

alter table public.products replica identity full;
alter table public.adverts replica identity full;
alter table public.site_content replica identity full;
alter table public.orders replica identity full;
alter table public.service_images replica identity full;

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
