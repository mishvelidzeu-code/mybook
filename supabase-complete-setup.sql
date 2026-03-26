create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'author' check (role in ('author', 'publisher', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  author text not null,
  genre text not null,
  type text not null check (type in ('ebook', 'audio')),
  details text not null,
  price numeric(10, 2) not null default 0,
  description text not null,
  top_pick boolean not null default false,
  age_restricted boolean not null default false,
  file_path text not null,
  cover_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  book_title text,
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  payment_method text,
  amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.sales
add column if not exists order_id text;

alter table public.sales
add column if not exists payment_provider text;

alter table public.sales
add column if not exists gateway_reference text;

alter table public.sales
add column if not exists status text;

alter table public.sales
add column if not exists paid_at timestamptz;

alter table public.sales
add column if not exists download_email_sent_at timestamptz;

alter table public.sales
add column if not exists delivered_at timestamptz;

update public.sales
set status = 'pending'
where status is null;

alter table public.sales
alter column status set default 'pending';

alter table public.sales
alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sales_status_check'
  ) then
    alter table public.sales
    add constraint sales_status_check
    check (status in ('pending', 'paid', 'failed', 'refunded', 'delivered'));
  end if;
end;
$$;

create index if not exists books_uploader_id_idx on public.books (uploader_id);
create index if not exists books_created_at_idx on public.books (created_at desc);
create index if not exists sales_book_id_idx on public.sales (book_id);
create index if not exists sales_created_at_idx on public.sales (created_at desc);
create unique index if not exists sales_order_id_idx on public.sales (order_id);
create index if not exists sales_status_idx on public.sales (status);
create index if not exists sales_gateway_reference_idx on public.sales (gateway_reference);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_role text;
begin
  safe_role := case
    when new.raw_user_meta_data ->> 'role' in ('author', 'publisher') then new.raw_user_meta_data ->> 'role'
    else 'author'
  end;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    safe_role
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_books_updated_at on public.books;
create trigger set_books_updated_at
before update on public.books
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.sales enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
)
with check (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);

drop policy if exists "books_public_read" on public.books;
create policy "books_public_read"
on public.books
for select
to anon, authenticated
using (true);

drop policy if exists "books_insert_own" on public.books;
create policy "books_insert_own"
on public.books
for insert
to authenticated
with check (
  auth.uid() = uploader_id
);

drop policy if exists "books_update_owner_or_admin" on public.books;
create policy "books_update_owner_or_admin"
on public.books
for update
to authenticated
using (
  auth.uid() = uploader_id
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
)
with check (
  auth.uid() = uploader_id
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);

drop policy if exists "sales_insert_public" on public.sales;
create policy "sales_insert_public"
on public.sales
for insert
to anon, authenticated
with check (true);

drop policy if exists "sales_select_owner_or_admin" on public.sales;
create policy "sales_select_owner_or_admin"
on public.sales
for select
to authenticated
using (
  exists (
    select 1
    from public.books
    where public.books.id = sales.book_id
      and public.books.uploader_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and admin_profile.role = 'admin'
  )
);

insert into storage.buckets (id, name, public)
values ('books', 'books', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "books_bucket_upload_authenticated" on storage.objects;
create policy "books_bucket_upload_authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'books');

drop policy if exists "books_bucket_update_authenticated" on storage.objects;
create policy "books_bucket_update_authenticated"
on storage.objects
for update
to authenticated
using (bucket_id = 'books')
with check (bucket_id = 'books');

drop policy if exists "covers_bucket_upload_authenticated" on storage.objects;
create policy "covers_bucket_upload_authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'covers');

drop policy if exists "covers_bucket_update_authenticated" on storage.objects;
create policy "covers_bucket_update_authenticated"
on storage.objects
for update
to authenticated
using (bucket_id = 'covers')
with check (bucket_id = 'covers');

drop policy if exists "covers_bucket_public_read" on storage.objects;
create policy "covers_bucket_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'covers');
