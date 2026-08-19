import { compact } from '@/lib/format';

const TONES = {
  rose:  { ring: 'from-blush to-white',  ink: 'text-rose' },
  grape: { ring: 'from-lilac to-white',  ink: 'text-grape' },
  mint:  { ring: 'from-mint to-white',   ink: 'text-emerald-600' },
};

export default function Stat({ label, value, sub, icon: Icon, tone = 'rose', delay = 0 }) {
  const t = TONES[tone] ?? TONES.rose;
  const numeric = value !== '' && value !== null && Number.isFinite(Number(value));

  return (
    <div className="card rise p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${t.ring} ${t.ink}`}>
          {Icon && <Icon size={17} strokeWidth={2} aria-hidden />}
        </span>
      </div>
      <div className="mt-3 font-display text-4xl leading-none">
        {/* нечисловые значения (день недели, прочерк) выводим как есть */}
        {numeric ? compact(value) : value}
      </div>
      {sub && <div className="mt-2 text-xs text-mute">{sub}</div>}
    </div>
  );
}
