import { redirect } from 'next/navigation';

// Дашборд живёт в группе (app), чтобы получить сайдбар и проверку сессии из её layout.
export default function Home() {
  redirect('/dashboard');
}
