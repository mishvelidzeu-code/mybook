alter table public.sales
add column if not exists order_id text;

create unique index if not exists sales_order_id_idx
on public.sales (order_id);

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

create index if not exists sales_status_idx on public.sales (status);
create index if not exists sales_gateway_reference_idx on public.sales (gateway_reference);
