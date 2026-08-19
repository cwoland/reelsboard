import { Flower2 } from 'lucide-react';

export function Pill({ children, tone = 'blush' }) {
  const tones = {
    blush: 'bg-blush/70 text-plum',
    lilac: 'bg-lilac text-grape',
    mint:  'bg-mint text-emerald-700',
    warn:  'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Button({ as: Tag = 'button', variant = 'solid', className = '', ...p }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-pill px-5 py-2.5 text-sm font-semibold transition active:scale-[.97] disabled:opacity-50 disabled:active:scale-100 cursor-pointer';
  const v = {
    solid: 'bg-rose text-white shadow-[0_10px_24px_-10px_#F2779E] hover:brightness-105',
    ghost: 'bg-white/70 text-plum border border-line hover:bg-white',
    soft:  'bg-lilac text-grape hover:brightness-97',
  }[variant];
  return <Tag className={`${base} ${v} ${className}`} {...p} />;
}

export function Field({ label, ...p }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-mute">{label}</span>
      <input
        {...p}
        className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm outline-none
                   placeholder:text-mute/60 focus:border-rose/60 focus:ring-4 focus:ring-blush/40 transition"
      />
    </label>
  );
}

export function Empty({ icon: Icon = Flower2, title, hint }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-blush/50 text-rose">
        <Icon size={26} strokeWidth={1.75} aria-hidden />
      </div>
      <div className="font-display text-xl">{title}</div>
      {hint && <div className="max-w-sm text-sm text-mute">{hint}</div>}
    </div>
  );
}