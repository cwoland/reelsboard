import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { scrapeReels, shortcodeOf } from '@/lib/apify';
import { saveSnapshot } from '@/lib/queries';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`)
    return NextResponse.json({ error: 'forbidden' }, { status: 401 });

  // 10 самых «протухших» рилсов за прогон — вписываемся в free-лимиты Apify
  const rows = await sql`
    select id, user_id, url, shortcode from reels
    order by coalesce(synced_at, 'epoch'::timestamptz) asc
    limit 10`;

  if (!rows.length) return NextResponse.json({ ok: true, updated: 0 });

  let items;
  try {
    items = await scrapeReels(rows.map(r => r.url));
  } catch (e) {
    return NextResponse.json({ error: String(e.message).slice(0, 300) }, { status: 502 });
  }

  const ownerOf = new Map(rows.map(r => [r.shortcode, r.user_id]));

  let updated = 0;
  for (const it of items) {
    const uid = ownerOf.get(it.shortcode) ?? ownerOf.get(shortcodeOf(it.url));
    if (uid && (await saveSnapshot(uid, it))) updated++;
  }
  return NextResponse.json({ ok: true, updated, checked: rows.length });
}
