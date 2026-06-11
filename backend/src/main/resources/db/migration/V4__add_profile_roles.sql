alter table public.profiles
  add column role text not null default 'user';

alter table public.profiles
  add constraint profiles_role_valid
  check (role in ('user', 'admin'));

create index idx_profiles_role on public.profiles(role);
