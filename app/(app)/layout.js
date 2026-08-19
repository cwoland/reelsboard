import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import Shell from '@/components/Shell';

export default async function AppLayout({ children }) {
  const me = await currentUser();
  if (!me) redirect('/login');

  return (
    <Suspense>
      <ShellWrap me={me}>{children}</ShellWrap>
    </Suspense>
  );
}

async function ShellWrap({ me, children }) {
  return <Shell me={JSON.parse(JSON.stringify(me))}>{children}</Shell>;
}

export const dynamic = 'force-dynamic';