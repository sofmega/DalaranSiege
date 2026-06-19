alter table public.build_items
  add column section text not null default 'CORE';

alter table public.build_items
  rename column slot_index to position;

alter table public.build_items
  drop constraint build_items_pkey,
  drop constraint build_items_slot_index_range;

-- Older builds may contain the same item in multiple slots. Keep its earliest
-- occurrence so the new build-wide uniqueness constraint can be applied safely.
delete from public.build_items duplicate
using public.build_items original
where duplicate.build_id = original.build_id
  and duplicate.item_id = original.item_id
  and duplicate.position > original.position;

alter table public.build_items
  alter column section drop default,
  add constraint build_items_section_valid
    check (section in ('EARLY', 'CORE', 'OPTIONAL')),
  add constraint build_items_position_range
    check (position >= 0 and position < 6),
  add constraint build_items_pkey
    primary key (build_id, section, position),
  add constraint build_items_unique_item_per_build
    unique (build_id, item_id);

create index idx_build_items_build_section_position
  on public.build_items(build_id, section, position);
