-- Outbox for transactional emails (Edge Functions cannot open Brevo SMTP ports)
create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'generic',
  to_email text not null,
  to_name text default '',
  reply_to_email text default '',
  reply_to_name text default '',
  subject text not null,
  html text not null,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'failed')),
  attempts int not null default 0,
  last_error text default '',
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists email_outbox_pending_idx
  on public.email_outbox (status, created_at)
  where status = 'pending';

alter table public.email_outbox enable row level security;

drop policy if exists "No public email_outbox" on public.email_outbox;
create policy "No public email_outbox" on public.email_outbox
  for all using (false) with check (false);

alter table public.orders
  add column if not exists email_notified_at timestamptz;
