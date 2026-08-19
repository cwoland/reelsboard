-- Демо-история метрик: достраивает 29 дней роста для уже загруженных рилсов.
-- Нужно только для показа: реальные снимки копятся сами при каждом обновлении.
-- Запуск: psql "$DATABASE_URL" -f db/seed-demo.sql

with base as (
  select r.id, l.views, l.likes, l.comments
  from reels r
  join reel_latest l on l.id = r.id
  where l.views > 0
),
days as (select generate_series(1, 29) as d)
insert into reel_stats (reel_id, views, plays, likes, comments, captured_at)
select
  b.id,
  greatest(1, round(b.views    * f.k))::bigint,
  greatest(1, round(b.views    * f.k))::bigint,
  greatest(0, round(b.likes    * f.k))::bigint,
  greatest(0, round(b.comments * f.k))::bigint,
  now() - make_interval(days => d.d)
from base b
cross join days d
cross join lateral (
  -- логарифмическая кривая: резкий старт в первые дни, потом плато
  select 0.18 + 0.82 * ln(1 + 9 * ((30 - d.d) / 30.0)) / ln(10.0) as k
) f
where not exists (
  select 1 from reel_stats s
  where s.reel_id = b.id and s.captured_at::date = (now() - make_interval(days => d.d))::date
);
