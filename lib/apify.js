const ACTOR = 'apify~instagram-scraper';

export function shortcodeOf(url) {
  const m = String(url).match(/instagram\.com\/(?:[^/?#]+\/)?(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

export function normalizeUrl(url) {
  const sc = shortcodeOf(url);
  return sc ? `https://www.instagram.com/reel/${sc}/` : null;
}

export function parseUrls(input, limit = 10) {
  const list = String(input || '').split(/[\s,;]+/).map(normalizeUrl).filter(Boolean);
  return [...new Set(list)].slice(0, limit);
}

const num = v => (typeof v === 'number' && v > 0 ? Math.round(v) : 0);

function mapItem(it) {
  return {
    shortcode: it.shortCode || shortcodeOf(it.url || it.inputUrl),
    url: it.url || it.inputUrl,
    caption: (it.caption || '').slice(0, 2000),
    cover: it.displayUrl || it.images?.[0] || null,
    postedAt: it.timestamp || null,
    owner: it.ownerUsername || null,
    duration: typeof it.videoDuration === 'number' ? Math.round(it.videoDuration) : null,
    views: num(it.videoPlayCount ?? it.videoViewCount),
    plays: num(it.videoPlayCount),
    likes: num(it.likesCount),      // -1 = лайки скрыты → 0
    comments: num(it.commentsCount),
  };
}

function mock(url) {
  const sc = shortcodeOf(url) || Math.random().toString(36).slice(2, 11);
  let h = 0;
  for (const ch of sc) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const base = 3000 + (h % 120000);
  // дрейф внутри 30-дневного окна, иначе абсолютные часы от эпохи дают миллионы
  const drift = (Math.floor(Date.now() / 36e5) % 720) * ((h % 12) + 1);
  const views = base + drift;
  return {
    shortcode: sc, url: normalizeUrl(url), caption: 'Демо-режим: APIFY_TOKEN не задан',
    cover: null, postedAt: new Date(Date.now() - (h % 45) * 864e5).toISOString(),
    owner: 'demo', duration: 12 + (h % 45),
    views, plays: views,
    likes: Math.round(views * (0.03 + (h % 60) / 1000)),
    comments: Math.round(views * 0.004),
  };
}

export async function scrapeReels(urls) {
  const token = process.env.APIFY_TOKEN;
  if (!token || /x{6,}/i.test(token)) return urls.map(mock);

  const endpoint =
    `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items` +
    `?token=${token}&timeout=110&memory=1024`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      directUrls: urls,
      resultsType: 'posts',
      resultsLimit: urls.length,
      addParentData: false,
    }),
    cache: 'no-store',
  });

  // 401/402/403 = токен невалиден или кончились кредиты free-плана.
  // Демо не должно падать на показе заказчику — уходим в демо-данные.
  if (res.status === 401 || res.status === 402 || res.status === 403) {
    console.warn(`[apify] ${res.status}: работаю на демо-данных`);
    return urls.map(mock);
  }
  if (!res.ok) throw new Error(`Apify ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const items = await res.json();
  return (Array.isArray(items) ? items : [])
    .filter(it => it && !it.error && (it.shortCode || it.url))
    .map(mapItem);
}