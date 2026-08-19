import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { setSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req) {
  const { email, password, name, handle, invite } = await req.json();

  if (process.env.INVITE_CODE && invite !== process.env.INVITE_CODE)
    return NextResponse.json({ error: 'Неверный код приглашения' }, { status: 403 });
  if (!email || !password || password.length < 6)
    return NextResponse.json({ error: 'Почта и пароль от 6 символов' }, { status: 400 });

  const [exists] = await sql`select 1 from users where email = ${email.toLowerCase().trim()}`;
  if (exists) return NextResponse.json({ error: 'Такая почта уже есть' }, { status: 409 });

  const [user] = await sql`
    insert into users (email, password_hash, display_name, handle)
    values (${email.toLowerCase().trim()}, ${await bcrypt.hash(password, 10)},
            ${name?.trim() || email.split('@')[0]}, ${handle?.replace(/^@/, '').trim() || null})
    returning *`;

  await setSession(user);
  return NextResponse.json({ ok: true });
}