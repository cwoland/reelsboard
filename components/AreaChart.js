'use client';
import { useState } from 'react';
import { compact } from '@/lib/format';

function smooth(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`;
  }
  return d;
}

export default function AreaChart({ data = [], yKey = 'views', label = 'Просмотры', height = 240 }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = height, PAD = 14;

  if (data.length < 2)
    return <div className="grid h-56 place-items-center text-sm text-mute">Данных пока мало — обнови рилсы завтра, и график оживёт 🌸</div>;

  const vals = data.map(d => Number(d[yKey]) || 0);
  const max = Math.max(...vals), min = Math.min(...vals);
  const span = max - min || 1;
  const x = i => PAD + (i / (data.length - 1)) * (W - PAD * 2);
  const y = v => PAD + (1 - (v - min) / span) * (H - PAD * 2);

  const pts = vals.map((v, i) => [x(i), y(v)]);
  const line = smooth(pts);
  const area = `${line} L ${x(data.length - 1)} ${H} L ${x(0)} ${H} Z`;
  const act = hover ?? data.length - 1;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={e => {
          const r = e.currentTarget.getBoundingClientRect();
          const rel = ((e.clientX - r.left) / r.width) * W;
          setHover(Math.max(0, Math.min(data.length - 1, Math.round(((rel - PAD) / (W - PAD * 2)) * (data.length - 1)))));
        }}>
        <defs>
          <linearGradient id="ac-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#F2779E" stopOpacity=".38" />
            <stop offset="100%" stopColor="#F2779E" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ac-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#A382EE" /><stop offset="100%" stopColor="#F2779E" />
          </linearGradient>
        </defs>

        {[0, .25, .5, .75, 1].map(t => (
          <line key={t} x1={0} x2={W} y1={PAD + t * (H - PAD * 2)} y2={PAD + t * (H - PAD * 2)}
                stroke="#F3E4EA" strokeWidth="1" />
        ))}

        <path d={area} fill="url(#ac-fill)" />
        <path d={line} fill="none" stroke="url(#ac-line)" strokeWidth="2.5"
              strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        <line x1={x(act)} x2={x(act)} y1={PAD} y2={H - PAD} stroke="#F2779E" strokeWidth="1" strokeDasharray="4 4" opacity=".5" />
        <circle cx={x(act)} cy={y(vals[act])} r="6" fill="#fff" stroke="#F2779E" strokeWidth="3" />
      </svg>

      <div className="pointer-events-none absolute left-0 top-0 rounded-2xl bg-white/90 px-3 py-2 shadow-sm">
        <div className="text-[11px] text-mute">
          {new Date(data[act].day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
        </div>
        <div className="font-display text-lg leading-tight">{compact(vals[act])} <span className="text-xs font-sans text-mute">{label.toLowerCase()}</span></div>
      </div>

      <div className="mt-1 flex justify-between px-1 text-[11px] text-mute">
        <span>{new Date(data[0].day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
        <span>{new Date(data.at(-1).day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  );
}