-- Admin can delete order requests; store latest status note for customers
alter table public.orders
  add column if not exists status_note text default '';

drop policy if exists "Admin delete orders" on public.orders;
create policy "Admin delete orders" on public.orders
  for delete using (public.is_admin());
