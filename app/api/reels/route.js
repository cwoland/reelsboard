import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { currentUser, scopeUserId } from '@/lib/auth';
import { parseUrls, shortcodeOf, scrapeReels } from '@/lib/apify';
import { getReels, saveSnapshot } from '@/lib/queries';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const target = scopeUserId(me, new URL(req.url).searchParams.get('user'));
  return NextResponse.json({ reels: await getReels(target) });
}

export async function POST(req) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { input } = await req.json();
  const urls = parseUrls(input);
  if (!urls.length)
    return NextResponse.json({ error: 'Не нашла ни одной ссылки на reels' }, { status: 400 });

  for (const url of urls) {
    await sql`
      insert into reels (user_id, url, shortcode) values (${me.id}, ${url}, ${shortcodeOf(url)})
      on conflict (user_id, shortcode) do update set url = excluded.url, status = 'pending'`;
  }

  let items;
  try {
    items = await scrapeReels(urls);
  } catch (e) {
    const msg = String(e.message).slice(0, 400);
    for (const url of urls) {
      await sql`update reels set status='error', error=${msg}, synced_at=now()
                where user_id=${me.id} and shortcode=${shortcodeOf(url)}`;
    }
    return NextResponse.json({ error: `Не смогла получить данные: ${msg}` }, { status: 502 });
  }

  let saved = 0;
  for (const it of items) if (await saveSnapshot(me.id, it)) saved++;

  const missed = urls.length - saved;
  if (missed > 0) {
    const got = new Set(items.map(i => i.shortcode));
    for (const url of urls) {
      const sc = shortcodeOf(url);
      if (!got.has(sc))
        await sql`update reels set status='error', error='Пост закрыт или удалён', synced_at=now()
                  where user_id=${me.id} and shortcode=${sc}`;
    }
  }

  return NextResponse.json({ ok: true, added: saved, failed: missed });
}