const ALLOWED = /(^|\.)(cdninstagram\.com|fbcdn\.net)$/i;

export async function GET(req) {
  const src = new URL(req.url).searchParams.get('u');
  if (!src) return new Response('no url', { status: 400 });

  let target;
  try { target = new URL(src); } catch { return new Response('bad url', { status: 400 }); }
  if (target.protocol !== 'https:' || !ALLOWED.test(target.hostname))
    return new Response('host not allowed', { status: 403 });   // защита от SSRF

  const upstream = await fetch(target, {
    headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.instagram.com/' },
    cache: 'no-store',
  });
  if (!upstream.ok) return new Response('upstream error', { status: 502 });

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
    },
  });
}