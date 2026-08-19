create table if not exists users (
  id            bigserial primary key,
  email         text unique not null,
  password_hash text not null,
  display_name  text not null,
  handle        text,
  role          text not null default 'blogger' check (role in ('blogger','admin')),
  created_at    timestamptz not null default now()
);

create table if not exists reels (
  id         bigserial primary key,
  user_id    bigint not null references users(id) on delete cascade,
  url        text not null,
  shortcode  text not null,
  caption    text,
  cover_url  text,
  posted_at  timestamptz,
  duration   numeric,
  status     text not null default 'pending' check (status in ('pending','ok','error')),
  error      text,
  synced_at  timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, shortcode)
);

create table if not exists reel_stats (
  id          bigserial primary key,
  reel_id     bigint not null references reels(id) on delete cascade,
  views       bigint not null default 0,
  plays       bigint not null default 0,
  likes       bigint not null default 0,
  comments    bigint not null default 0,
  captured_at timestamptz not null default now()
);

create index if not exists idx_stats_reel_time on reel_stats (reel_id, captured_at desc);
create index if not exists idx_reels_user      on reels (user_id);

create or replace view reel_latest as
select distinct on (r.id)
  r.id, r.user_id, r.url, r.shortcode, r.caption, r.cover_url,
  r.posted_at, r.duration, r.status, r.error, r.synced_at, r.created_at,
  coalesce(s.views,0)    as views,
  coalesce(s.plays,0)    as plays,
  coalesce(s.likes,0)    as likes,
  coalesce(s.comments,0) as comments,
  s.captured_at
from reels r
left join reel_stats s on s.reel_id = r.id
order by r.id, s.captured_at desc nulls last;