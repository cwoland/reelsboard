import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { sql } from './db';

export const COOKIE = 'pp_session';
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me');

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key());
}

export async function verifyToken(token) {
  try { return (await jwtVerify(token, key())).payload; } catch { return null; }
}

export async function setSession(user) {
  const token = await signToken({ uid: Number(user.id), role: user.role });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() { (await cookies()).delete(COOKIE); }

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const [u] = await sql`
    select id, email, display_name, handle, role, created_at
    from users where id = ${payload.uid}`;
  return u ?? null;
}

export function scopeUserId(me, requested) {
  const asked = Number(requested);
  if (me.role === 'admin' && Number.isInteger(asked) && asked > 0) return asked;
  return Number(me.id);
}