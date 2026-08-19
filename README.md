# Reelsboard

Личные кабинеты и аналитика Instagram Reels для внутренних блогеров.
Блогер вставляет ссылку на рилс — обложка, дата, просмотры, лайки и комментарии
подтягиваются из Apify и складываются в историю, по которой строятся графики.

**Стек:** Next.js 16 (App Router, JS) · React 19 · Tailwind 4 · Postgres (чистый SQL) · Apify

---

## Возможности

- Личный кабинет у каждого блогера, данные изолированы между аккаунтами
- Роль `admin`: список команды, создание блогеров, просмотр чужого кабинета (`?user=<id>`)
- Добавление до 10 ссылок за раз одним запросом к Apify
- История метрик (`reel_stats`): снимок при каждом обновлении → графики и прирост за 7 дней
- Два вида списка: лента карточек и таблица-«БД» с поиском и сортировкой
- Дашборд, аналитика, разрез «лучший день недели для публикации», ER
- Ежедневное автообновление через Vercel Cron
- Прокси обложек (Instagram CDN блокирует hotlink) с белым списком хостов
- Демо-режим: без валидного `APIFY_TOKEN` сайт работает на сгенерированных данных

---

## Локальный запуск

```bash
npm install
cp .env.example .env.local     # заполнить значения
npm run dev
```

Инициализация схемы и первого админа — один раз:

```bash
curl "http://localhost:3000/api/setup?key=$SETUP_KEY"
```

Схема лежит в `db/schema.sql`. Демо-история метрик для показа:

```bash
psql "$DATABASE_URL" -f db/seed-demo.sql
```

`lib/db.js` определяет драйвер автоматически: хост `*.neon.tech` → HTTP-драйвер
`@neondatabase/serverless` (нужен для serverless), любой другой Postgres → обычный `pg`.
Поэтому локально работает Postgres.app, а на проде — Neon.

---

## Деплой на Vercel

1. **Neon** — neon.tech → New project → Connection string → взять **pooled** (в хосте есть `-pooler`).
2. **Apify** — apify.com → Settings → API & Integrations → Personal API token.
3. **Секреты:**
   ```bash
   openssl rand -hex 32   # AUTH_SECRET
   openssl rand -hex 16   # SETUP_KEY, CRON_SECRET
   ```
4. **Vercel** — импортировать репозиторий, добавить все переменные из `.env.example`
   в Settings → Environment Variables (Production + Preview).
5. После первого деплоя один раз дёрнуть `https://<домен>/api/setup?key=<SETUP_KEY>`.
6. Зайти под `ADMIN_EMAIL` / `ADMIN_PASSWORD`, завести блогеров на странице «Команда».

Крон (`vercel.json`) обновляет 10 самых давно синхронизированных рилсов ежедневно в 06:00 UTC.

---

## Ограничения

- Apify отдаёт только **публичные** посты. Закрытый профиль → рилс помечается `status='error'`.
- Free-план Apify — ~$5 кредитов в месяц, поэтому батчи ограничены 10 ссылками.
- `views` берётся из `videoPlayCount`, при отсутствии — из `videoViewCount`.
  Скрытые лайки Instagram отдаёт как `-1`, нормализуются в `0`.

---

## Структура

```
app/(app)/          защищённые страницы: дашборд, рилсы, аналитика, команда
app/api/            REST: auth, reels, team, setup, img-прокси, cron
components/         Shell, AreaChart (свой SVG), карточки, формы
lib/db.js           выбор драйвера Postgres
lib/queries.js      все SQL-запросы проекта
lib/apify.js        клиент Apify + демо-режим
proxy.js            защита роутов (в Next 16 это бывший middleware.js)
db/schema.sql       схема + view reel_latest
```
