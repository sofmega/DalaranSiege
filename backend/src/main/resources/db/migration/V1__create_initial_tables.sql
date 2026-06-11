create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz not null default now()
);

create table public.heroes (
  id text primary key,
  name text not null,
  hero_class text not null,
  roles text[] not null default '{}',
  icon_url text not null
);

create table public.shops (
  id text primary key,
  name text not null
);

create table public.items (
  id text primary key,
  name text not null,
  item_class text not null,
  price integer not null,
  bonuses text[] not null default '{}',
  description text not null,
  range integer,
  stats jsonb not null default '{}',
  requirements jsonb not null default '[]',
  shop_ids text[] not null default '{}',
  icon_url text not null
);

create table public.builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hero_id text not null references public.heroes(id),
  name text not null,
  notes text not null default '',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.build_items (
  build_id uuid not null references public.builds(id) on delete cascade,
  item_id text not null references public.items(id),
  slot_index integer not null,
  primary key (build_id, slot_index)
);