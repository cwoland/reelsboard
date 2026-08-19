import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { getTeam } from '@/lib/queries';

export const runtime = 'nodejs';

export async function GET() {
  const me = await currentUser();
  if (me?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ team: await getTeam() });
}

export async function POST(req) {
  const me = await currentUser();
  if (me?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { email, password, name, handle } = await req.json();
  if (!email || !password || password.length < 6)
    return NextResponse.json({ error: 'Почта и пароль от 6 символов' }, { status: 400 });

  try {
    await sql`
      insert into users (email, password_hash, display_name, handle)
      values (${email.toLowerCase().trim()}, ${await bcrypt.hash(password, 10)},
              ${name?.trim() || email.split('@')[0]}, ${handle?.replace(/^@/, '') || null})`;
  } catch {
    return NextResponse.json({ error: 'Такая почта уже занята' }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}