-- Bounty referral schema used by /referrals and /join?ref=<code>.
--
-- Reconstructed from the client calls in lib/bounty.ts on 2026-10-12. The
-- production project may differ; review the policies and the trigger before
-- applying this to an existing database.

create table if not exists public.bounty_scouts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  uni_id text not null unique,
  referral_code text not null unique,
  recruits_count integer not null default 0,
  claimed_tiers text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bounty_scouts_recruits_count_idx
  on public.bounty_scouts (recruits_count desc);

create table if not exists public.bounty_referrals (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid not null references public.bounty_scouts (id) on delete cascade,
  referred_name text not null,
  referred_uni_id text,
  created_at timestamptz not null default now(),
  unique (scout_id, referred_uni_id)
);

create or replace function public.increment_scout_recruits_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bounty_scouts
  set recruits_count = recruits_count + 1,
      updated_at = now()
  where id = new.scout_id;
  return new;
end;
$$;

drop trigger if exists bounty_referral_created on public.bounty_referrals;
create trigger bounty_referral_created
  after insert on public.bounty_referrals
  for each row execute function public.increment_scout_recruits_count();

alter table public.bounty_scouts enable row level security;
alter table public.bounty_referrals enable row level security;

create policy "bounty scouts are publicly readable"
  on public.bounty_scouts for select
  using (true);

create policy "scouts can be enrolled with the anon key"
  on public.bounty_scouts for insert
  with check (true);

create policy "scout names can be refreshed with the anon key"
  on public.bounty_scouts for update
  using (true)
  with check (true);

create policy "referrals are publicly readable"
  on public.bounty_referrals for select
  using (true);

create policy "referrals can be recorded with the anon key"
  on public.bounty_referrals for insert
  with check (true);
