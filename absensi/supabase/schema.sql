-- Jalankan di Supabase SQL Editor.
-- 1) Buat akun admin di Authentication > Users.
-- 2) Ambil UUID user tersebut.
-- 3) Jalankan bagian INSERT setelah tabel dibuat.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin'))
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  member_id text not null unique,
  name text not null,
  info text,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('Hadir','Izin','Sakit','Alpha')),
  created_at timestamptz not null default now(),
  unique(member_id, attendance_date)
);

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.attendance enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "admin read own profile" on public.profiles;
create policy "admin read own profile" on public.profiles
for select to authenticated
using (id = auth.uid() and role = 'admin');

drop policy if exists "admins manage members" on public.members;
create policy "admins manage members" on public.members
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage attendance" on public.attendance;
create policy "admins manage attendance" on public.attendance
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- GANTI UUID_ADMIN dengan UUID user admin dari Supabase Authentication.
-- insert into public.profiles (id, role)
-- values ('UUID_ADMIN', 'admin');

-- Setelah insert, jangan expose service_role key ke frontend.
