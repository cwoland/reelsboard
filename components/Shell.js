'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Clapperboard, ChartLine, Users,
  Flower2, ArrowLeft, LogOut,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Дашборд',   icon: LayoutDashboard },
  { href: '/reels',     label: 'Мои рилсы', icon: Clapperboard },
  { href: '/analytics', label: 'Аналитика', icon: ChartLine },
];

export default function Shell({ me, children }) {
  const path = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const user = params.get('user');
  const withUser = href => (user ? `${href}?user=${user}` : href);

  // Админ может открыть кабинет блогера через ?user=<id> — покажем, чей именно.
  const [viewing, setViewing] = useState(null);
  useEffect(() => {
    if (!user || me.role !== 'admin' || Number(user) === Number(me.id)) {
      setViewing(null);
      return;
    }
    let alive = true;
    fetch('/api/team')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (alive) setViewing(d?.team?.find(u => Number(u.id) === Number(user)) ?? null);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [user, me.role, me.id]);

  const nav = me.role === 'admin' ? [...NAV, { href: '/team', label: 'Команда', icon: Users }] : NAV;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] gap-6 p-4 lg:p-6">
      <aside className="card sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col p-5 lg:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-rose to-grape text-white">
            <Flower2 size={20} strokeWidth={2} aria-hidden />
          </span>
          <span className="font-display text-xl leading-tight">Reels<span className="text-rose">board</span></span>
        </Link>

        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={withUser(href)}
                className={`flex items-center gap-3 rounded-pill px-4 py-3 text-sm font-semibold transition
                  ${active ? 'bg-blush/80 text-plum shadow-[0_8px_20px_-14px_#F2779E]' : 'text-mute hover:bg-white/70 hover:text-plum'}`}>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.9} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          {viewing && (
            <div className="mb-3 rounded-2xl bg-lilac/70 p-3 text-xs">
              <div className="font-semibold text-grape">Смотришь кабинет</div>
              <div className="text-plum">{viewing.display_name}</div>
              <Link href="/dashboard" className="mt-1 inline-flex items-center gap-1 font-semibold text-rose">
                <ArrowLeft size={13} strokeWidth={2.2} aria-hidden /> вернуться к себе
              </Link>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blush font-display text-plum">
              {me.display_name?.[0]?.toUpperCase() || <Flower2 size={16} strokeWidth={2} aria-hidden />}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{me.display_name}</div>
              <div className="truncate text-[11px] text-mute">{me.handle ? '@' + me.handle : me.email}</div>
            </div>
          </div>
          <button onClick={logout}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-pill py-2 text-xs font-semibold text-mute transition hover:text-rose">
            <LogOut size={13} strokeWidth={2} aria-hidden /> Выйти
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>

      <nav className="card fixed inset-x-3 bottom-3 z-40 flex justify-around p-2 lg:hidden">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={withUser(href)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold
              ${path === href ? 'bg-blush/80 text-plum' : 'text-mute'}`}>
            <Icon size={19} strokeWidth={path === href ? 2.2 : 1.9} aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}