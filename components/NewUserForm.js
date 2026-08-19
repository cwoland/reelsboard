'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field } from './Bits';

export default function NewUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', handle: '', email: '', password: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const on = k => e => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch('/api/team', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
    });
    setBusy(false);
    if (!res.ok) return setErr((await res.json()).error);
    setF({ name: '', handle: '', email: '', password: '' });
    setOpen(false);
    router.refresh();
  }

  if (!open)
    return <Button variant="ghost" onClick={() => setOpen(true)}>＋ Добавить блогера</Button>;

  return (
    <form onSubmit={submit} className="card rise p-5">
      <h2 className="mb-4 font-display text-xl">Новый блогер</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Имя"     value={f.name}     onChange={on('name')}     placeholder="Катя" />
        <Field label="Ник в IG" value={f.handle}  onChange={on('handle')}   placeholder="katya.reels" />
        <Field label="Почта"   value={f.email}    onChange={on('email')}    type="email" required />
        <Field label="Пароль"  value={f.password} onChange={on('password')} type="text" required minLength={6} />
      </div>
      {err && <p className="mt-3 text-xs text-rose">{err}</p>}
      <div className="mt-4 flex gap-2">
        <Button disabled={busy}>{busy ? 'Создаю…' : 'Создать'}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
      </div>
    </form>
  );
}