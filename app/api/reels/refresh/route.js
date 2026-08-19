import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { scrapeReels } from '@/lib/apify';
import { saveSnapshot } from '@/lib/queries';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { ids } = await req.json().catch(() => ({}));

  const rows = Array.isArray(ids) && ids.length
    ? await sql`select url, shortcode from reels
                where user_id = ${me.id} and id = any(${ids.map(Number)}::bigint[])`
    : await sql`select url, shortcode from reels
                where user_id = ${me.id}
                order by coalesce(synced_at, 'epoch') asc
                limit 10`; 

  if (!rows.length) return NextResponse.json({ ok: true, updated: 0 });

  let items;
  try {
    items = await scrapeReels(rows.map(r => r.url));
  } catch (e) {
    return NextResponse.json({ error: String(e.message).slice(0, 300) }, { status: 502 });
  }

  let updated = 0;
  for (const it of items) if (await saveSnapshot(me.id, it)) updated++;
  return NextResponse.json({ ok: true, updated });
}