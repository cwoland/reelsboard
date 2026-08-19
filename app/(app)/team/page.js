import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { getTeam } from '@/lib/queries';
import { compact, nf, agoRu } from '@/lib/format';
import { Flower2, ArrowRight } from 'lucide-react';
import { Pill } from '@/components/Bits';
import NewUserForm from '@/components/NewUserForm';

export const dynamic = 'force-dynamic';

export default async function Team() {
  const me = await currentUser();
  if (me?.role !== 'admin') redirect('/dashboard');
  const team = await getTeam();

  return (
    <>
      <header className="mb-6">
        <p className="text-sm text-mute">{team.length} аккаунтов</p>
        <h1 className="font-display text-4xl">Команда</h1>
      </header>

      <div className="mb-6"><NewUserForm /></div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {team.map((u, i) => (
          <div key={u.id} className="card rise p-5" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blush to-lilac font-display text-xl text-plum">
                {u.display_name?.[0]?.toUpperCase() || <Flower2 size={20} strokeWidth={2} aria-hidden />}
              </span>
              <div className="min-w-0">
                <div className="truncate font-display text-lg leading-tight">{u.display_name}</div>
                <div className="truncate text-xs text-mute">{u.handle ? '@' + u.handle : u.email}</div>
              </div>
              {u.role === 'admin' && <span className="ml-auto"><Pill tone="lilac">админ</Pill></span>}
            </div>

            <div className="my-4 grid grid-cols-3 gap-2 text-center">
              {[['Рилсов', u.reels], ['Просмотры', compact(u.views)], ['Лайки', compact(u.likes)]].map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-shell/70 py-2.5">
                  <div className="font-display text-xl leading-none">{v}</div>
                  <div className="mt-1 text-[10px] text-mute">{l}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-mute">
              <span>синк {agoRu(u.synced_at)}</span>
              <Link href={`/dashboard?user=${u.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-rose hover:underline">
                Открыть кабинет
                <ArrowRight size={13} strokeWidth={2.2} aria-hidden />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}