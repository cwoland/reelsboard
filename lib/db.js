import { neon } from '@neondatabase/serverless';
import pg from 'pg';

const url = process.env.DATABASE_URL || '';
if (!url) throw new Error('DATABASE_URL не задан — заполни .env.local');

// Neon отдаёт HTTP-эндпоинт: идеально для serverless (нет пула, нет холодных коннектов).
// Любой другой Postgres (локальный, Supabase, Railway) идёт через обычный pg.
const isNeonHttp = /\.neon\.tech|\.neon\.build/.test(url);

function pgAdapter(connectionString) {
  const pool = new pg.Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    ssl: /sslmode=require/.test(connectionString) ? { rejectUnauthorized: false } : false,
  });

  const run = async (text, params = []) => (await pool.query(text, params)).rows;

  // Повторяем API neon(): тег-шаблон -> параметризованный запрос ($1, $2, ...)
  const tag = (strings, ...values) => {
    const text = strings.reduce(
      (acc, chunk, i) => acc + chunk + (i < values.length ? `$${i + 1}` : ''),
      ''
    );
    return run(text, values);
  };
  tag.query = run;
  return tag;
}

export const sql = isNeonHttp ? neon(url) : pgAdapter(url);
export const driver = isNeonHttp ? 'neon-http' : 'pg';
