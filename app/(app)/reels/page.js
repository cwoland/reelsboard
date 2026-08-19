import { currentUser, scopeUserId } from '@/lib/auth';
import { getReels } from '@/lib/queries';
import { AddReelForm, ReelsView, RefreshButton } from '@/components/ReelsClient';

export const dynamic = 'force-dynamic';

export default async function ReelsPage({ searchParams }) {
  const me = await currentUser();
  const sp = await searchParams;
  const reels = await getReels(scopeUserId(me, sp?.user));

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mute">{reels.length} рилсов в кабинете</p>
          <h1 className="font-display text-4xl">Мои рилсы</h1>
        </div>
        <RefreshButton />
      </header>

      <div className="mb-6"><AddReelForm /></div>
      <ReelsView reels={JSON.parse(JSON.stringify(reels))} />
    </>
  );
}