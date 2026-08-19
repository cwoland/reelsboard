import { compact } from '@/lib/format';

export default function Stat({ label, value, sub, emoji, tone = 'rose', delay = 0 }) {
  const ring = { rose: 'from-blush to-white', grape: 'from-lilac to-white', mint: 'from-mint to-white' }[tone];
  return (
    <div className="card rise p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold tracking-wide text-mute uppercase">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${ring} text-base`}>{emoji}</span>
      </div>
      <div className="mt-3 font-display text-4xl leading-none">
        {/* нечисловые значения (день недели, прочерк) выводим как есть */}
        {Number.isFinite(Number(value)) && value !== '' && value !== null
          ? compact(value)
          : value}
      </div>
      {sub && <div className="mt-2 text-xs text-mute">{sub}</div>}
    </div>
  );
}