import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { setSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: 'Заполни почту и пароль' }, { status: 400 });

  const [user] = await sql`select * from users where email = ${String(email).toLowerCase().trim()}`;
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return NextResponse.json({ error: 'Неверная почта или пароль' }, { status: 401 });

  await setSession(user);
  return NextResponse.json({ ok: true });
}