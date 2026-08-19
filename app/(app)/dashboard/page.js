import Link from 'next/link';
import { currentUser, scopeUserId } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getKpi, getSeries, getTop } from '@/lib/queries';
import { compact, agoRu, dateRu, proxy } from '@/lib/format';
import Stat from '@/components/Stat';
import AreaChart from '@/components/AreaChart';
import { Pill } from '@/components/Bits';
import { RefreshButton } from '@/components/ReelsClient';

export const dynamic = 'force-dynamic';

export default async function Dashboard({ searchParams }) {
  const me = await currentUser();
  const sp = await searchParams;
  const uid = scopeUserId(me, sp?.user);

  const owner =
    uid === Number(me.id)
      ? me
      : (await sql`select display_name, handle from users where id = ${uid}`)[0];

  const [kpi, series, top] = await Promise.all([
    getKpi(uid),
    getSeries(uid, 30),
    getTop(uid, 5),
  ]);

  const first = Number(series[0]?.views || 0);
  const last = Number(series.at(-1)?.views || 0);
  const growth = last - first;
  const pct = first > 0 ? Math.round((growth / first) * 100) : 0;

  const totalViews = Number(kpi.views);
  const er = totalViews > 0
    ? (((Number(kpi.likes) + Number(kpi.comments)) / totalViews) * 100).toFixed(2)
    : '0.00';

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mute">Привет, {owner?.display_name} ✿</p>
          <h1 className="font-display text-4xl">Дашборд</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-mute">обновлено {agoRu(kpi.synced_at)}</span>
          <RefreshButton />
        </div>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Рилсов" value={kpi.reels} emoji="🎀" tone="rose" delay={0} />
        <Stat label="Просмотров" value={kpi.views} emoji="👀" tone="grape"
              sub={`в среднем ${compact(kpi.avg_views)} на рилс`} delay={60} />
        <Stat label="Лайков" value={kpi.likes} emoji="💗" tone="rose"
              sub={`${compact(kpi.comments)} комментариев`} delay={120} />
        <Stat label="Вовлечённость" value={er} emoji="✨" tone="mint"
              sub="(лайки + комменты) / просмотры" delay={180} />
      </section>

      <section className="mb-6 grid gap-4 xl:grid-cols-3">
        <div className="card rise p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Просмотры за 30 дней</h2>
            <Pill tone={growth >= 0 ? 'mint' : 'warn'}>
              {growth >= 0 ? '▲' : '▼'} {compact(Math.abs(growth))} · {pct}%
            </Pill>
          </div>
          <AreaChart data={JSON.parse(JSON.stringify(series))} yKey="views" label="Просмотры" />
        </div>

        <div className="card rise p-6">
          <h2 className="mb-4 font-display text-2xl">Топ-5 рилсов</h2>
          {top.length === 0 ? (
            <p className="text-sm text-mute">Пока пусто — добавь первую ссылку.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {top.map((r, i) => (
                <li key={r.id} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blush/70 font-display text-sm">
                    {i + 1}
                  </span>
                  <div className="h-12 w-9 shrink-0 overflow-hidden rounded-xl bg-shell">
                    {r.cover_url
                      ? <img src={proxy(r.cover_url)} alt="" className="h-full w-full object-cover" />
                      : <div className="grid h-full place-items-center text-xs">🌸</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <a href={r.url} target="_blank" rel="noreferrer"
                       className="line-clamp-1 text-sm font-semibold hover:text-rose">
                      {r.caption?.trim() || 'Без описания'}
                    </a>
                    <div className="text-[11px] text-mute">{dateRu(r.posted_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-base leading-none">{compact(r.views)}</div>
                    <div className="text-[10px] text-mute">просм.</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <Link href="/reels"
            className="card rise flex items-center justify-between gap-4 p-6 transition hover:-translate-y-0.5">
        <div>
          <div className="font-display text-2xl">Добавить рилс</div>
          <div className="text-sm text-mute">
            Вставь ссылку из Instagram — обложка, дата и просмотры подтянутся сами
          </div>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-rose text-xl text-white">→</span>
      </Link>
    </>
  );
}
