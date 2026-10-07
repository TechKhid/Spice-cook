-- ==========================================================================
-- Spice N Cook: visitor insights
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Then change the passphrase at the bottom (and keep it to yourself).
--
-- Privacy by design:
--   * No IP addresses are stored. Location is approximate (city level),
--     looked up in the visitor's browser, with coordinates rounded to ~10 km.
--   * Visitors can only ADD rows. Nobody can read them without the
--     dashboard passphrase, which is checked inside the database.
-- ==========================================================================

create table if not exists public.snc_events (
  id      bigint generated always as identity primary key,
  at      timestamptz not null default now(),
  vid     text not null check (char_length(vid) between 6 and 40),   -- random id per browser
  sid     text not null check (char_length(sid) between 6 and 40),   -- random id per visit
  type    text not null check (type in ('view', 'section', 'add', 'checkout', 'pay', 'paid', 'whatsapp', 'bulk', 'leave')),
  detail  text check (char_length(detail) <= 200),
  path    text check (char_length(path) <= 200),
  ref     text check (char_length(ref) <= 200),      -- where they came from (referrer host)
  tag     text check (char_length(tag) <= 60),       -- ?r=… tag on the link you shared
  city    text check (char_length(city) <= 80),
  region  text check (char_length(region) <= 80),
  country text check (char_length(country) <= 80),
  cc      text check (char_length(cc) <= 2),
  lat     numeric(4, 1),
  lon     numeric(4, 1),
  tz      text check (char_length(tz) <= 60),
  device  text check (char_length(device) <= 40),
  os      text check (char_length(os) <= 40),
  browser text check (char_length(browser) <= 40),
  app     text check (char_length(app) <= 40),       -- e.g. opened inside Instagram / TikTok
  lang    text check (char_length(lang) <= 20),
  screen  text check (char_length(screen) <= 20),
  secs    integer check (secs between 0 and 86400)   -- active seconds on the page
);

create index if not exists snc_events_at_idx on public.snc_events (at desc);
create index if not exists snc_events_sid_idx on public.snc_events (sid);

alter table public.snc_events enable row level security;

-- Visitors may add events, stamped with the current time. There is no SELECT
-- policy, so the public key cannot read anything back.
drop policy if exists "visitors can log events" on public.snc_events;
create policy "visitors can log events" on public.snc_events
  for insert to anon
  with check (at between now() - interval '2 minutes' and now() + interval '2 minutes');

-- The dashboard passphrase lives in a table nobody can read through the API.
create table if not exists public.snc_settings (
  id         int primary key default 1 check (id = 1),
  passphrase text not null check (char_length(passphrase) >= 12 and passphrase <> 'change-me-to-a-long-passphrase')
);
alter table public.snc_settings enable row level security;

-- Read events for the dashboard, only with the right passphrase.
-- A wrong passphrase raises an error (after a 1-second pause, to slow guessing).
create or replace function public.snc_read(passphrase text, since timestamptz)
returns setof public.snc_events
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from snc_settings s where s.passphrase = snc_read.passphrase) then
    perform pg_sleep(1);
    raise exception 'wrong passphrase' using errcode = '28P01';
  end if;
  return query
    select e.* from snc_events e
    where e.at >= snc_read.since
    order by e.at desc
    limit 20000;
end;
$$;

revoke all on function public.snc_read(text, timestamptz) from public;
grant execute on function public.snc_read(text, timestamptz) to anon;

-- Optional clean-up: delete everything older than a year.
-- delete from public.snc_events where at < now() - interval '1 year';

-- ⬇ CHANGE THIS to your own long passphrase (12+ characters), then run the file.
insert into public.snc_settings (id, passphrase)
values (1, 'change-me-to-a-long-passphrase')
on conflict (id) do update set passphrase = excluded.passphrase;
