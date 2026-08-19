import { currentUser, scopeUserId } from '@/lib/auth';
import { getSeries, getGrowth, getBestDays, getKpi } from '@/lib/queries';
import { compact, nf, dateRu, DOW, proxy } from '@/lib/format';
import AreaChart from '@/components/AreaChart';
import { Pill, Empty } from '@/components/Bits';
import Stat from '@/components/Stat';

export const dynamic = 'force-dynamic';

export default async function Analytics({ searchParams }) {
  const me = await currentUser();
  const sp = await searchParams;
  const uid = scopeUserId(me, sp?.user);
  const days = Math.min(90, Math.max(7, Number(sp?.days) || 30));

  const [series, growth, best, kpi] = await Promise.all([
    getSeries(uid, days), getGrowth(uid), getBestDays(uid), getKpi(uid),
  ]);

  if (!growth.length) return <Empty emoji="📊" title="Аналитики пока нет" hint="Добавь рилсы — и здесь появятся графики, приросты и лучший день для публикации." />;

  const maxDow = Math.max(...best.map(b => Number(b.avg_views)), 1);
  const champion = [...best].sort((a, b) => b.avg_views - a.avg_views)[0];
  const total7 = growth.reduce((s, r) => s + Number(r.growth_7d), 0);
  const avgEr = (growth.reduce((s, r) => s + Number(r.er), 0) / growth.length).toFixed(2);

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mute">Динамика и разрезы</p>
          <h1 className="font-display text-4xl">Аналитика</h1>
        </div>
        <div className="flex rounded-pill bg-white/70 p-1">
          {[7, 30, 90].map(d => (
            <a key={d} href={`/analytics?days=${d}${sp?.user ? `&user=${sp.user}` : ''}`}
              className={`rounded-pill px-4 py-1.5 text-xs font-semibold transition ${days === d ? 'bg-blush text-plum' : 'text-mute'}`}>
              {d} дней
            </a>
          ))}
        </div>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Прирост за 7 дней" value={total7} emoji="🚀" tone="grape" sub="суммарно по всем рилсам" />
        <Stat label="Средний ER"        value={avgEr} emoji="✨" tone="mint" sub="в процентах" />
        <Stat label="Медиана просмотров" value={median(growth.map(r => Number(r.views)))} emoji="📈" tone="rose" />
        <Stat label="Лучший день"       value={champion ? DOW[champion.dow - 1] : '—'} emoji="🗓" tone="rose"
              sub={champion ? `${compact(champion.avg_views)} просмотров в среднем` : null} />
      </section>

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <h2 className="mb-4 font-display text-2xl">Просмотры</h2>
          <AreaChart data={series} yKey="views" label="Просмотры" />
        </div>
        <div className="card p-6">
          <h2 className="mb-4 font-display text-2xl">Когда постить</h2>
          <div className="flex flex-col gap-2.5">
            {DOW.map((name, i) => {
              const row = best.find(b => b.dow === i + 1);
              const v = Number(row?.avg_views || 0);
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-7 text-xs font-semibold text-mute">{name}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-pill bg-shell">
                    <div className="h-full rounded-pill bg-gradient-to-r from-grape to-rose transition-all"
                         style={{ width: `${Math.max(3, (v / maxDow) * 100)}%` }} />
                  </div>
                  <span className="w-14 text-right text-xs text-mute">{v ? compact(v) : '—'}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-mute">Среднее число просмотров у рилсов, опубликованных в этот день недели.</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="p-6 pb-3"><h2 className="font-display text-2xl">Все рилсы</h2></div>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-mute">
              <th className="px-6 py-3 font-semibold">Рилс</th>
              <th className="px-3 py-3 font-semibold">Дата</th>
              <th className="px-3 py-3 text-right font-semibold">Просмотры</th>
              <th className="px-3 py-3 text-right font-semibold">+ за 7 дней</th>
              <th className="px-6 py-3 text-right font-semibold">ER</th>
            </tr>
          </thead>
          <tbody>
            {growth.map(r => (
              <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-blush/20">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-9 shrink-0 overflow-hidden rounded-xl bg-shell">
                      {r.cover_url ? <img src={proxy(r.cover_url)} alt="" className="h-full w-full object-cover" />
                                   : <div className="grid h-full place-items-center text-xs">🌸</div>}
                    </div>
                    <a href={r.url} target="_blank" rel="noreferrer" className="line-clamp-1 max-w-sm font-medium hover:text-rose">
                      {r.caption?.trim() || 'Без описания'}
                    </a>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-mute">{dateRu(r.posted_at)}</td>
                <td className="px-3 py-3 text-right font-display text-lg">{nf.format(r.views)}</td>
                <td className="px-3 py-3 text-right">
                  {Number(r.growth_7d) > 0
                    ? <Pill tone="mint">▲ {compact(r.growth_7d)}</Pill>
                    : <span className="text-mute">—</span>}
                </td>
                <td className="px-6 py-3 text-right"><Pill tone={Number(r.er) >= 5 ? 'mint' : 'lilac'}>{r.er}%</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}