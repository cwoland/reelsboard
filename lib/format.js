export const nf = new Intl.NumberFormat('ru-RU');

export function compact(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1).replace('.0', '') + 'M';
  if (v >= 1_000)     return (v / 1_000).toFixed(v >= 10_000 ? 0 : 1).replace('.0', '') + 'K';
  return nf.format(v);
}

export function dateRu(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' });
}

export function agoRu(d) {
  if (!d) return 'никогда';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1)   return 'только что';
  if (m < 60)  return `${m} мин назад`;
  if (m < 1440) return `${Math.floor(m / 60)} ч назад`;
  return `${Math.floor(m / 1440)} дн назад`;
}

export const proxy = (url) => (url ? `/api/img?u=${encodeURIComponent(url)}` : null);

export const DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];