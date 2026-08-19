import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

const DDL = `
create table if not exists users (
  id bigserial primary key, email text unique not null, password_hash text not null,
  display_name text not null, handle text,
  role text not null default 'blogger' check (role in ('blogger','admin')),
  created_at timestamptz not null default now());
create table if not exists reels (
  id bigserial primary key, user_id bigint not null references users(id) on delete cascade,
  url text not null, shortcode text not null, caption text, cover_url text,
  posted_at timestamptz, duration numeric,
  status text not null default 'pending' check (status in ('pending','ok','error')),
  error text, synced_at timestamptz, created_at timestamptz not null default now(),
  unique (user_id, shortcode));
create table if not exists reel_stats (
  id bigserial primary key, reel_id bigint not null references reels(id) on delete cascade,
  views bigint not null default 0, plays bigint not null default 0,
  likes bigint not null default 0, comments bigint not null default 0,
  captured_at timestamptz not null default now());
create index if not exists idx_stats_reel_time on reel_stats (reel_id, captured_at desc);
create index if not exists idx_reels_user on reels (user_id);
create or replace view reel_latest as
select distinct on (r.id) r.id, r.user_id, r.url, r.shortcode, r.caption, r.cover_url,
  r.posted_at, r.duration, r.status, r.error, r.synced_at, r.created_at,
  coalesce(s.views,0) as views, coalesce(s.plays,0) as plays,
  coalesce(s.likes,0) as likes, coalesce(s.comments,0) as comments, s.captured_at
from reels r left join reel_stats s on s.reel_id = r.id
order by r.id, s.captured_at desc nulls last;
`;

export async function GET(req) {
  const key = new URL(req.url).searchParams.get('key');
  if (!process.env.SETUP_KEY || key !== process.env.SETUP_KEY)
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  for (const stmt of DDL.split(';').map(s => s.trim()).filter(Boolean)) {
    await sql.query(stmt);
  }

  let admin = null;
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    const [row] = await sql`
      insert into users (email, password_hash, display_name, role)
      values (${process.env.ADMIN_EMAIL.toLowerCase()}, ${hash}, 'Админ', 'admin')
      on conflict (email) do update set password_hash = excluded.password_hash, role = 'admin'
      returning email, role`;
    admin = row;
  }
  return NextResponse.json({ ok: true, admin });
}