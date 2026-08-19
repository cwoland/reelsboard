import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function DELETE(_req, { params }) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const [row] = await sql`
    delete from reels
    where id = ${Number(id)} and (user_id = ${me.id} or ${me.role === 'admin'})
    returning id`;

  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}