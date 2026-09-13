-- Security hardening: rate limits + authenticated order inserts only

create table if not exists public.rate_limits (
  bucket text primary key,
  hit_count int not null default 0,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;

-- No direct client access; only security-definer RPC / service role
drop policy if exists "No public rate_limits" on public.rate_limits;
create policy "No public rate_limits" on public.rate_limits
  for all using (false) with check (false);

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_limit int default 5,
  p_window_seconds int default 3600
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.rate_limits%rowtype;
  now_ts timestamptz := now();
  safe_bucket text := left(coalesce(nullif(trim(p_bucket), ''), 'unknown'), 180);
  safe_limit int := greatest(1, least(coalesce(p_limit, 5), 100));
  safe_window int := greatest(30, least(coalesce(p_window_seconds, 3600), 86400));
begin
  insert into public.rate_limits as rl (bucket, hit_count, window_start)
  values (safe_bucket, 1, now_ts)
  on conflict (bucket) do update
  set
    hit_count = case
      when rl.window_start + make_interval(secs => safe_window) < now_ts then 1
      else rl.hit_count + 1
    end,
    window_start = case
      when rl.window_start + make_interval(secs => safe_window) < now_ts then now_ts
      else rl.window_start
    end
  returning * into rec;

  return rec.hit_count <= safe_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, int, int) from public;
revoke all on function public.consume_rate_limit(text, int, int) from anon, authenticated;
grant execute on function public.consume_rate_limit(text, int, int) to service_role;

-- Orders: only signed-in users may create requests (matches site cart auth gate)
drop policy if exists "Anyone insert orders" on public.orders;
drop policy if exists "Authenticated insert orders" on public.orders;
create policy "Authenticated insert orders" on public.orders
  for insert
  with check (
    auth.uid() is not null
    and (user_id is null or user_id = auth.uid())
  );

-- Prevent clients from elevating their own role
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );
