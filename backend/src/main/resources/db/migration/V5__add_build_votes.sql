create table public.build_votes (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote_value smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint build_votes_value_valid check (vote_value in (-1, 1)),
  constraint build_votes_one_per_user unique (build_id, user_id)
);

create index idx_build_votes_build_id on public.build_votes(build_id);
create index idx_build_votes_user_id on public.build_votes(user_id);

create trigger set_build_votes_updated_at
before update on public.build_votes
for each row
execute function public.set_updated_at();

alter table public.build_votes enable row level security;

create policy "build votes are readable"
on public.build_votes
for select
using (true);

create policy "build votes are insertable by owner"
on public.build_votes
for insert
with check (auth.uid() = user_id);

create policy "build votes are updatable by owner"
on public.build_votes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "build votes are deletable by owner"
on public.build_votes
for delete
using (auth.uid() = user_id);
