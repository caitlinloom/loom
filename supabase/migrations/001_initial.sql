-- ═══════════════════════════════════════════════════════════════════════════
-- Loom — initial schema
-- Run via: supabase db push  (or paste into Supabase SQL editor)
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable PostGIS for geography distance queries
create extension if not exists postgis;

-- ── profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  phone             text,
  name              text,
  birth_date        date,
  gender            text,
  orientation       text,
  religion          text,
  monogamy          text,
  bio               text check (char_length(bio) <= 250),
  location_name     text,
  location_lat      double precision,
  location_lng      double precision,
  location          geography(point, 4326),   -- computed from lat/lng via trigger
  onboarding_step   int  not null default 0,  -- 0=auth 1=subscribed 2=profile 3=prefs 4=done
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Auto-update `location` point from lat/lng
create or replace function public.sync_location()
returns trigger language plpgsql as $$
begin
  if new.location_lat is not null and new.location_lng is not null then
    new.location = st_setsrid(st_makepoint(new.location_lng, new.location_lat), 4326);
  end if;
  return new;
end;
$$;

create trigger trg_sync_location
  before insert or update on public.profiles
  for each row execute procedure public.sync_location();

-- ── photos ───────────────────────────────────────────────────────────────────
create table public.photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  url         text not null,
  position    smallint not null check (position between 0 and 3),
  created_at  timestamptz not null default now(),
  unique (user_id, position)
);

-- ── preferences ──────────────────────────────────────────────────────────────
create table public.preferences (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid unique not null references public.profiles(id) on delete cascade,
  genders           text[]  not null default '{}',
  orientations      text[]  not null default '{}',
  monogamy_stances  text[]  not null default '{}',
  religions         text[]  not null default '{}',
  age_min           int     not null default 18,
  age_max           int     not null default 100,
  distance_miles    int     not null default 50,
  updated_at        timestamptz not null default now()
);

-- ── question_answers ─────────────────────────────────────────────────────────
create table public.question_answers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  question_id  int  not null,
  answer       int  not null,   -- 0-9 for scale, 0-(n-1) for choice
  created_at   timestamptz not null default now(),
  unique (user_id, question_id)
);

-- ── compatibility_scores ─────────────────────────────────────────────────────
create table public.compatibility_scores (
  id                   uuid primary key default gen_random_uuid(),
  user_a               uuid not null references public.profiles(id) on delete cascade,
  user_b               uuid not null references public.profiles(id) on delete cascade,
  overall              int  not null,
  cat_values           int  not null default 0,
  cat_communication    int  not null default 0,
  cat_lifestyle        int  not null default 0,
  cat_finances         int  not null default 0,
  cat_intimacy         int  not null default 0,
  cat_family           int  not null default 0,
  cat_growth           int  not null default 0,
  cat_dealbreakers     int  not null default 0,
  calculated_at        timestamptz not null default now(),
  unique (user_a, user_b)
);

-- ── interactions ─────────────────────────────────────────────────────────────
create table public.interactions (
  id          uuid primary key default gen_random_uuid(),
  from_user   uuid not null references public.profiles(id) on delete cascade,
  to_user     uuid not null references public.profiles(id) on delete cascade,
  action      text not null check (action in ('like','pass')),
  created_at  timestamptz not null default now(),
  unique (from_user, to_user)
);

-- Trigger: when two users mutually like each other, auto-create a match
create or replace function public.check_mutual_like()
returns trigger language plpgsql security definer as $$
declare
  mutual_exists boolean;
begin
  if new.action <> 'like' then
    return new;
  end if;

  select exists(
    select 1 from public.interactions
    where from_user = new.to_user
      and to_user   = new.from_user
      and action    = 'like'
  ) into mutual_exists;

  if mutual_exists then
    insert into public.matches (user_a, user_b, created_at)
    values (new.from_user, new.to_user, now())
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger trg_check_mutual_like
  after insert on public.interactions
  for each row execute procedure public.check_mutual_like();

-- ── matches ───────────────────────────────────────────────────────────────────
create table public.matches (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid not null references public.profiles(id) on delete cascade,
  user_b      uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  -- Canonical ordering: user_a < user_b (enforced by insert)
  unique (user_a, user_b)
);

-- ── messages ─────────────────────────────────────────────────────────────────
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 2000),
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);

create index idx_messages_match_id on public.messages(match_id, created_at);

-- ── subscriptions ─────────────────────────────────────────────────────────────
create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid unique not null references public.profiles(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  status                 text check (status in ('active','canceled','past_due','trialing','incomplete')),
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.profiles             enable row level security;
alter table public.photos               enable row level security;
alter table public.preferences          enable row level security;
alter table public.question_answers     enable row level security;
alter table public.compatibility_scores enable row level security;
alter table public.interactions         enable row level security;
alter table public.matches              enable row level security;
alter table public.messages             enable row level security;
alter table public.subscriptions        enable row level security;

-- profiles: users can read any profile; only own row is writable
create policy "profiles: read all"       on public.profiles for select using (true);
create policy "profiles: own write"      on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: own update"     on public.profiles for update using (auth.uid() = id);

-- photos: public read; own write
create policy "photos: read all"         on public.photos for select using (true);
create policy "photos: own insert"       on public.photos for insert with check (auth.uid() = user_id);
create policy "photos: own delete"       on public.photos for delete using (auth.uid() = user_id);

-- preferences: private
create policy "prefs: own"               on public.preferences for all using (auth.uid() = user_id);

-- question_answers: own only
create policy "qa: own"                  on public.question_answers for all using (auth.uid() = user_id);

-- compatibility_scores: read where you are user_a; edge function writes with service role
create policy "compat: read own"         on public.compatibility_scores for select using (auth.uid() = user_a);

-- interactions: own reads/writes
create policy "interactions: own insert" on public.interactions for insert with check (auth.uid() = from_user);
create policy "interactions: own select" on public.interactions for select using (auth.uid() = from_user);

-- matches: participants can read
create policy "matches: participants"    on public.matches for select
  using (auth.uid() = user_a or auth.uid() = user_b);

-- messages: participants of the associated match can read/insert
create policy "messages: participants select" on public.messages for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );
create policy "messages: participants insert" on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );
create policy "messages: mark read" on public.messages for update
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- subscriptions: own only (edge functions use service role)
create policy "subs: own"                on public.subscriptions for select using (auth.uid() = user_id);

-- ── Storage bucket ─────────────────────────────────────────────────────────────
-- Create in Supabase dashboard or via:
-- insert into storage.buckets (id, name, public) values ('profile-photos', 'profile-photos', true);
--
-- Storage RLS (run after bucket creation):
-- create policy "photos: authenticated upload"
--   on storage.objects for insert with check (
--     bucket_id = 'profile-photos' and auth.role() = 'authenticated'
--   );
-- create policy "photos: public read"
--   on storage.objects for select using (bucket_id = 'profile-photos');
-- create policy "photos: own delete"
--   on storage.objects for delete using (
--     bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]
--   );

-- ── Realtime ──────────────────────────────────────────────────────────────────
-- Enable realtime on messages so the chat screen can subscribe to new rows
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;
