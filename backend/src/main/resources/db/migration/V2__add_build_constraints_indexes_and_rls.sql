alter table public.profiles
  add constraint profiles_username_not_blank
  check (username is null or length(trim(username)) > 0);

alter table public.heroes
  add constraint heroes_name_not_blank
  check (length(trim(name)) > 0),
  add constraint heroes_class_not_blank
  check (length(trim(hero_class)) > 0),
  add constraint heroes_icon_url_not_blank
  check (length(trim(icon_url)) > 0);

alter table public.shops
  add constraint shops_name_not_blank
  check (length(trim(name)) > 0);

alter table public.items
  add constraint items_name_not_blank
  check (length(trim(name)) > 0),
  add constraint items_class_not_blank
  check (length(trim(item_class)) > 0),
  add constraint items_price_non_negative
  check (price >= 0),
  add constraint items_description_not_blank
  check (length(trim(description)) > 0),
  add constraint items_icon_url_not_blank
  check (length(trim(icon_url)) > 0);

alter table public.builds
  add constraint builds_name_not_blank
  check (length(trim(name)) > 0);

alter table public.build_items
  add constraint build_items_slot_index_range
  check (slot_index >= 0 and slot_index < 6);

create index idx_builds_user_id on public.builds(user_id);
create index idx_builds_hero_id on public.builds(hero_id);
create index idx_builds_public on public.builds(is_public) where is_public = true;
create index idx_build_items_item_id on public.build_items(item_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_builds_updated_at
before update on public.builds
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.builds enable row level security;
alter table public.build_items enable row level security;

create policy "profiles are readable by owner"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles are insertable by owner"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles are updatable by owner"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "builds are readable by owner or public"
on public.builds
for select
using (is_public = true or auth.uid() = user_id);

create policy "builds are insertable by owner"
on public.builds
for insert
with check (auth.uid() = user_id);

create policy "builds are updatable by owner"
on public.builds
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "builds are deletable by owner"
on public.builds
for delete
using (auth.uid() = user_id);

create policy "build items are readable through readable builds"
on public.build_items
for select
using (
  exists (
    select 1
    from public.builds
    where builds.id = build_items.build_id
      and (builds.is_public = true or builds.user_id = auth.uid())
  )
);

create policy "build items are insertable through owned builds"
on public.build_items
for insert
with check (
  exists (
    select 1
    from public.builds
    where builds.id = build_items.build_id
      and builds.user_id = auth.uid()
  )
);

create policy "build items are updatable through owned builds"
on public.build_items
for update
using (
  exists (
    select 1
    from public.builds
    where builds.id = build_items.build_id
      and builds.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.builds
    where builds.id = build_items.build_id
      and builds.user_id = auth.uid()
  )
);

create policy "build items are deletable through owned builds"
on public.build_items
for delete
using (
  exists (
    select 1
    from public.builds
    where builds.id = build_items.build_id
      and builds.user_id = auth.uid()
  )
);
