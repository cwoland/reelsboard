import { sql } from './db';

export const getReels = (userId) => sql`
  select * from reel_latest
  where user_id = ${userId}
  order by coalesce(posted_at, created_at) desc`;

export async function getKpi(userId) {
  const [row] = await sql`
    select count(*)::int                                as reels,
           coalesce(sum(views),0)::bigint               as views,
           coalesce(sum(likes),0)::bigint               as likes,
           coalesce(sum(comments),0)::bigint            as comments,
           coalesce(round(avg(nullif(views,0))),0)::bigint as avg_views,
           max(synced_at)                               as synced_at
    from reel_latest where user_id = ${userId}`;
  return row;
}

export const getSeries = (userId, days = 30) => sql`
  with d as (
    select generate_series(current_date - (${days}::int - 1), current_date, '1 day')::date as day
  ),
  snap as (
    select distinct on (r.id, d.day)
           r.id as reel_id, d.day,
           coalesce(s.views,0) as views,
           coalesce(s.likes,0) + coalesce(s.comments,0) as engagement
    from d
    join reels r on r.user_id = ${userId}
    left join reel_stats s on s.reel_id = r.id and s.captured_at < d.day + 1
    order by r.id, d.day, s.captured_at desc nulls last
  )
  select day,
         sum(views)::bigint      as views,
         sum(engagement)::bigint as engagement
  from snap group by day order by day`;

export const getTop = (userId, limit = 5) => sql`
  select id, caption, cover_url, url, views, likes, comments, posted_at
  from reel_latest where user_id = ${userId}
  order by views desc, posted_at desc nulls last
  limit ${limit}`;

export const getGrowth = (userId) => sql`
  with mine as (select id from reels where user_id = ${userId}),
  latest as (
    select distinct on (reel_id) reel_id, views, likes, comments, captured_at
    from reel_stats where reel_id in (select id from mine)
    order by reel_id, captured_at desc
  ),
  past as (
    select distinct on (reel_id) reel_id, views
    from reel_stats
    where reel_id in (select id from mine) and captured_at < now() - interval '7 days'
    order by reel_id, captured_at desc
  )
  select r.id, r.caption, r.cover_url, r.url, r.posted_at, r.status,
         coalesce(l.views,0)::bigint    as views,
         coalesce(l.likes,0)::bigint    as likes,
         coalesce(l.comments,0)::bigint as comments,
         (coalesce(l.views,0) - coalesce(p.views, l.views, 0))::bigint as growth_7d,
         case when coalesce(l.views,0) > 0
              then round((coalesce(l.likes,0)+coalesce(l.comments,0))::numeric
                         / l.views * 100, 2)
              else 0 end as er
  from reels r
  left join latest l on l.reel_id = r.id
  left join past   p on p.reel_id = r.id
  where r.user_id = ${userId}
  order by views desc`;

export const getBestDays = (userId) => sql`
  select extract(isodow from posted_at)::int as dow,
         count(*)::int                       as posts,
         round(avg(views))::bigint           as avg_views
  from reel_latest
  where user_id = ${userId} and posted_at is not null and views > 0
  group by 1 order by dow`;

export const getTeam = () => sql`
  select u.id, u.display_name, u.handle, u.role, u.email, u.created_at,
         count(l.id)::int                  as reels,
         coalesce(sum(l.views),0)::bigint  as views,
         coalesce(sum(l.likes),0)::bigint  as likes,
         coalesce(sum(l.comments),0)::bigint as comments,
         max(l.synced_at)                  as synced_at
  from users u
  left join reel_latest l on l.user_id = u.id
  group by u.id, u.display_name, u.handle, u.role, u.email, u.created_at
  order by views desc, u.created_at`;

export async function saveSnapshot(userId, it) {
  const [r] = await sql`
    update reels set caption   = ${it.caption},
                     cover_url = ${it.cover},
                     posted_at = ${it.postedAt},
                     duration  = ${it.duration},
                     status    = 'ok', error = null, synced_at = now()
    where user_id = ${userId} and shortcode = ${it.shortcode}
    returning id`;
  if (!r) return null;

  await sql`
    insert into reel_stats (reel_id, views, plays, likes, comments)
    select ${r.id}, ${it.views}, ${it.plays}, ${it.likes}, ${it.comments}
    where not exists (
      select 1 from reel_stats s
      where s.reel_id = ${r.id} and s.views = ${it.views}
        and s.likes = ${it.likes} and s.comments = ${it.comments}
        and s.captured_at > now() - interval '6 hours')`;
  return r.id;
}