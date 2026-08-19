'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { compact, nf, dateRu, agoRu, proxy } from '@/lib/format';
import { Button, Pill, Empty } from './Bits';

export function RefreshButton({ ids = null, small = false }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const res = await fetch('/api/reels/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    setBusy(false);
    if (!res.ok) alert((await res.json()).error || 'Ошибка обновления');
    router.refresh();
  }

  if (small)
    return (
      <button onClick={run} disabled={busy} title="Обновить"
        className="grid h-8 w-8 place-items-center rounded-full bg-white/85 text-sm shadow-sm transition hover:bg-white disabled:opacity-50">
        <span className={busy ? 'inline-block animate-spin' : ''}>⟳</span>
      </button>
    );

  return <Button onClick={run} disabled={busy} variant="soft">
    <span className={busy ? 'inline-block animate-spin' : ''}>⟳</span>
    {busy ? 'Обновляю…' : 'Обновить всё'}
  </Button>;
}

export default RefreshButton;

export function AddReelForm() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await fetch('/api/reels', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg({ bad: true, text: data.error });
    setInput('');
    setMsg({ text: `Готово: добавлено ${data.added}${data.failed ? `, не открылось ${data.failed}` : ''} 🌸` });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card rise p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">🔗</span>
        <h2 className="font-display text-xl">Добавить рилсы</h2>
        <span className="text-xs text-mute">до 10 ссылок за раз</span>
      </div>
      <textarea
        value={input} onChange={e => setInput(e.target.value)} rows={3}
        placeholder={'https://www.instagram.com/reel/Cxxxxxxxxxx/\nhttps://www.instagram.com/reel/Cyyyyyyyyyy/'}
        className="w-full resize-none rounded-2xl border border-line bg-white/80 p-4 text-sm outline-none
                   placeholder:text-mute/60 focus:border-rose/60 focus:ring-4 focus:ring-blush/40 transition" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className={`text-xs ${msg?.bad ? 'text-rose' : 'text-mute'}`}>
          {msg?.text || 'Данные тянутся из Apify: обложка, дата, просмотры, лайки, комментарии'}
        </p>
        <Button disabled={busy || !input.trim()}>{busy ? 'Загружаю…' : 'Загрузить'}</Button>
      </div>
    </form>
  );
}

function useDelete() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return [pending, (id) => {
    if (!confirm('Удалить рилс вместе с историей метрик?')) return;
    start(async () => {
      await fetch(`/api/reels/${id}`, { method: 'DELETE' });
      router.refresh();
    });
  }];
}

function Cover({ r, className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-blush/60 to-lilac ${className}`}>
      {r.cover_url
        ? <img src={proxy(r.cover_url)} alt="" loading="lazy" className="h-full w-full object-cover" />
        : <div className="grid h-full place-items-center text-3xl opacity-60">🎀</div>}
      {r.duration ? (
        <span className="absolute bottom-2 right-2 rounded-pill bg-plum/70 px-2 py-0.5 text-[10px] font-semibold text-white">
          {Math.floor(r.duration / 60)}:{String(Math.round(r.duration % 60)).padStart(2, '0')}
        </span>
      ) : null}
    </div>
  );
}

export function ReelsView({ reels }) {
  const [mode, setMode] = useState('grid');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('date');
  const [pending, remove] = useDelete();

  const list = reels
    .filter(r => !q || (r.caption || '').toLowerCase().includes(q.toLowerCase()) || r.shortcode.includes(q))
    .sort((a, b) => {
      if (sort === 'views') return Number(b.views) - Number(a.views);
      if (sort === 'likes') return Number(b.likes) - Number(a.likes);
      return new Date(b.posted_at || b.created_at) - new Date(a.posted_at || a.created_at);
    });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по описанию…"
          className="min-w-[180px] flex-1 rounded-pill border border-line bg-white/80 px-4 py-2 text-sm outline-none focus:border-rose/60" />
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="rounded-pill border border-line bg-white/80 px-4 py-2 text-sm outline-none">
          <option value="date">Сначала новые</option>
          <option value="views">По просмотрам</option>
          <option value="likes">По лайкам</option>
        </select>
        <div className="flex rounded-pill bg-white/70 p-1">
          {[['grid', '🖼 Лента'], ['table', '🗂 Таблица']].map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)}
              className={`rounded-pill px-4 py-1.5 text-xs font-semibold transition ${mode === k ? 'bg-blush text-plum' : 'text-mute'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 && <Empty title="Здесь пока пусто" hint="Вставь ссылку на reels выше — всё остальное подтянется само." />}

      {mode === 'grid' && list.length > 0 && (
        <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ${pending ? 'opacity-60' : ''}`}>
          {list.map((r, i) => (
            <article key={r.id} className="card rise group overflow-hidden" style={{ animationDelay: `${i * 35}ms` }}>
              <div className="relative">
                <Cover r={r} className="aspect-[4/5]" />
                <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                  <RefreshButton ids={[r.id]} small />
                  <button onClick={() => remove(r.id)} title="Удалить"
                    className="grid h-8 w-8 place-items-center rounded-full bg-white/85 text-sm shadow-sm hover:bg-white hover:text-rose">✕</button>
                </div>
                {r.status === 'error' && (
                  <span className="absolute left-2 top-2"><Pill tone="warn">ошибка</Pill></span>
                )}
              </div>

              <div className="p-4">
                <a href={r.url} target="_blank" rel="noreferrer" className="line-clamp-2 text-sm font-semibold hover:text-rose">
                  {r.caption?.trim() || 'Без описания'}
                </a>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="font-display text-3xl leading-none">{compact(r.views)}</div>
                    <div className="text-[11px] text-mute">просмотров</div>
                  </div>
                  <div className="text-right text-xs text-mute">
                    <div>💗 {compact(r.likes)}</div>
                    <div>💬 {compact(r.comments)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[11px] text-mute">
                  <span>{dateRu(r.posted_at)}</span>
                  <span>синк {agoRu(r.synced_at)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {mode === 'table' && list.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-mute">
                <th className="p-4 font-semibold">Рилс</th>
                <th className="p-4 font-semibold">Дата</th>
                <th className="p-4 text-right font-semibold">Просмотры</th>
                <th className="p-4 text-right font-semibold">Лайки</th>
                <th className="p-4 text-right font-semibold">Комменты</th>
                <th className="p-4 text-right font-semibold">ER</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {list.map(r => {
                const er = Number(r.views) > 0
                  ? (((Number(r.likes) + Number(r.comments)) / Number(r.views)) * 100).toFixed(2) : '0.00';
                return (
                  <tr key={r.id} className="border-b border-line/60 transition last:border-0 hover:bg-blush/20">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Cover r={r} className="h-14 w-10 shrink-0 rounded-xl" />
                        <a href={r.url} target="_blank" rel="noreferrer" className="line-clamp-2 max-w-xs font-medium hover:text-rose">
                          {r.caption?.trim() || r.shortcode}
                        </a>
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-3 text-mute">{dateRu(r.posted_at)}</td>
                    <td className="p-3 text-right font-display text-lg">{nf.format(r.views)}</td>
                    <td className="p-3 text-right">{nf.format(r.likes)}</td>
                    <td className="p-3 text-right">{nf.format(r.comments)}</td>
                    <td className="p-3 text-right"><Pill tone={Number(er) >= 5 ? 'mint' : 'lilac'}>{er}%</Pill></td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1.5">
                        <RefreshButton ids={[r.id]} small />
                        <button onClick={() => remove(r.id)}
                          className="grid h-8 w-8 place-items-center rounded-full bg-white/85 text-sm hover:text-rose">✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}