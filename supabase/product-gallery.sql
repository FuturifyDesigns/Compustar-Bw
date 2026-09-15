-- Extra product photos (cover stays in image_url; gallery_urls holds all including cover order)
alter table public.products
  add column if not exists gallery_urls jsonb not null default '[]'::jsonb;
