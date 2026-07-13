create table public.compositions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint compositions_name_length
    check (length(trim(name)) between 3 and 80),
  constraint compositions_notes_length
    check (length(notes) <= 2000)
);

create table public.composition_heroes (
  composition_id uuid not null references public.compositions(id) on delete cascade,
  hero_id text not null references public.heroes(id),
  position smallint not null,
  constraint composition_heroes_pkey primary key (composition_id, position),
  constraint composition_heroes_unique_hero unique (composition_id, hero_id),
  constraint composition_heroes_position_range check (position between 0 and 5)
);

create table public.composition_votes (
  id uuid primary key default gen_random_uuid(),
  composition_id uuid not null references public.compositions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote_value smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint composition_votes_value_valid check (vote_value in (-1, 1)),
  constraint composition_votes_one_per_user unique (composition_id, user_id)
);

create index idx_compositions_created_at on public.compositions(created_at desc);
create index idx_compositions_user_id on public.compositions(user_id);
create index idx_composition_heroes_hero_id on public.composition_heroes(hero_id);
create index idx_composition_votes_composition_id on public.composition_votes(composition_id);
create index idx_composition_votes_user_id on public.composition_votes(user_id);

create trigger set_compositions_updated_at
before update on public.compositions
for each row
execute function public.set_updated_at();

create trigger set_composition_votes_updated_at
before update on public.composition_votes
for each row
execute function public.set_updated_at();

create or replace function public.enforce_user_composition_limit()
returns trigger
language plpgsql
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  if (
    select count(*)
    from public.compositions
    where user_id = new.user_id
      and id <> new.id
  ) >= 4 then
    raise exception 'A user can create a maximum of 4 compositions.';
  end if;

  return new;
end;
$$;

create trigger enforce_user_composition_limit
before insert or update of user_id on public.compositions
for each row
execute function public.enforce_user_composition_limit();

alter table public.compositions enable row level security;
alter table public.composition_heroes enable row level security;
alter table public.composition_votes enable row level security;

create policy "compositions are publicly readable"
on public.compositions
for select
to anon, authenticated
using (true);

create policy "compositions are insertable by owner"
on public.compositions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "compositions are deletable by owner"
on public.compositions
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "composition heroes are publicly readable"
on public.composition_heroes
for select
to anon, authenticated
using (true);

create policy "composition heroes are insertable through owned compositions"
on public.composition_heroes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.compositions
    where compositions.id = composition_heroes.composition_id
      and compositions.user_id = (select auth.uid())
  )
);

create policy "composition votes are publicly readable"
on public.composition_votes
for select
to anon, authenticated
using (true);

create policy "composition votes are insertable by voter"
on public.composition_votes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "composition votes are updatable by voter"
on public.composition_votes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "composition votes are deletable by voter"
on public.composition_votes
for delete
to authenticated
using ((select auth.uid()) = user_id);
