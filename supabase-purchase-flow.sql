alter table public.sales
add column if not exists status text not null default 'pending'
check (status in ('pending', 'paid', 'failed', 'refunded', 'delivered'));

alter table public.sales
add column if not exists payment_provider text;

alter table public.sales
add column if not exists gateway_reference text;

alter table public.sales
add column if not exists paid_at timestamptz;

alter table public.sales
add column if not exists download_email_sent_at timestamptz;

alter table public.sales
add column if not exists delivered_at timestamptz;

create table if not exists public.download_tokens (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  buyer_email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  max_downloads integer not null default 3,
  download_count integer not null default 0,
  last_downloaded_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sales_status_idx on public.sales (status);
create index if not exists sales_gateway_reference_idx on public.sales (gateway_reference);
create index if not exists download_tokens_sale_id_idx on public.download_tokens (sale_id);
create index if not exists download_tokens_token_hash_idx on public.download_tokens (token_hash);
create index if not exists download_tokens_expires_at_idx on public.download_tokens (expires_at);

alter table public.download_tokens enable row level security;

drop policy if exists "download_tokens_admin_only" on public.download_tokens;
create policy "download_tokens_admin_only"
on public.download_tokens
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);
