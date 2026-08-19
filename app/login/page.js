'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field } from '@/components/Bits';

export default function Login() {
  const router = useRouter();
  const [tab, setTab] = useState('login');
  const [f, setF] = useState({ email: '', password: '', name: '', handle: '', invite: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const on = k => e => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch(`/api/auth/${tab === 'login' ? 'login' : 'register'}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
    });
    setBusy(false);
    if (!res.ok) return setErr((await res.json()).error || 'Что-то пошло не так');
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-rose to-grape text-2xl text-white shadow-[0_18px_40px_-18px_#F2779E]">✿</div>
          <h1 className="font-display text-4xl">Reels<span className="text-rose">board</span></h1>
          <p className="mt-1 text-sm text-mute">Кабинет и аналитика для наших блогеров</p>
        </div>

        <div className="card rise p-6">
          <div className="mb-5 flex rounded-pill bg-shell p-1">
            {[['login', 'Вход'], ['register', 'Регистрация']].map(([k, l]) => (
              <button key={k} onClick={() => { setTab(k); setErr(null); }}
                className={`flex-1 rounded-pill py-2 text-sm font-semibold transition ${tab === k ? 'bg-white text-plum shadow-sm' : 'text-mute'}`}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            {tab === 'register' && (
              <>
                <Field label="Как тебя зовут" value={f.name} onChange={on('name')} placeholder="Катя" />
                <Field label="Ник в Instagram" value={f.handle} onChange={on('handle')} placeholder="katya.reels" />
              </>
            )}
            <Field label="Почта" type="email" required value={f.email} onChange={on('email')} placeholder="you@mail.com" />
            <Field label="Пароль" type="password" required minLength={6} value={f.password} onChange={on('password')} placeholder="••••••" />
            {tab === 'register' && (
              <Field label="Код приглашения" value={f.invite} onChange={on('invite')} placeholder="выдаёт админ" />
            )}
            {err && <p className="text-xs font-semibold text-rose">{err}</p>}
            <Button className="mt-1 w-full" disabled={busy}>
              {busy ? 'Секунду…' : tab === 'login' ? 'Войти' : 'Создать аккаунт'}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11px] text-mute">Instagram Reels · данные обновляются через Apify</p>
      </div>
    </main>
  );
}