create or replace function public.enforce_user_build_limit_per_hero()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.builds
    where user_id = new.user_id
      and hero_id = new.hero_id
      and id <> new.id
  ) >= 4 then
    raise exception 'A user can create a maximum of 4 builds per hero.';
  end if;

  return new;
end;
$$;

create trigger enforce_user_build_limit_per_hero
before insert or update of user_id, hero_id on public.builds
for each row
execute function public.enforce_user_build_limit_per_hero();
