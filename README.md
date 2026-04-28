# LIMS | DNA Lab Journal 🧬

Система управления лабораторной информацией для учёта биологических проб, экстракции ДНК, протоколирования ПЦР-исследований и отслеживания результатов секвенирования.

> Лабораторный журнал нового поколения — с аудитом, сканером штрих-кодов, импортом из Excel и PWA-поддержкой.

## Технический стек

| Категория | Технология |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Runtime** | Node.js 24+ |
| **Data Fetching** | TanStack Query v5 |
| **ORM** | Prisma 7 (миграции) + Drizzle ORM (запросы) |
| **Database** | SQLite (LibSQL) |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **Linter / Formatter** | Biome |
| **E2E Testing** | Playwright |
| **Unit Testing** | Vitest |
| **PWA** | next-pwa (offline-режим, установка) |

## Быстрый старт

```bash
git clone <repository-url> lab-journal
cd lab-journal
npm install
npm run setup        # Генерация Prisma, применение схемы, создание .env
npm run dev          # http://localhost:3000
```

Для авторизации используйте CLI-генератор токенов:

```bash
npm run auth         # Создание одноразового токена входа
```

## Структура проекта

```text
lab-journal/
├── app/              # Next.js App Router (страницы, API, Server Actions)
│   ├── api/          #   REST API (specimens, pcr, import, export, auth...)
│   ├── admin/        #   Панель администрирования
│   └── login/        #   Страница авторизации
├── components/       # React-компоненты
│   ├── features/     #   Feature-компоненты (таблицы, фильтры, DevTools)
│   ├── ui/           #   UI-примитивы (Button, Card, TextField, FAB)
│   ├── modals/       #   Модальные окна (CRUD проб, ПЦР)
│   ├── layout/       #   Layout-провайдеры (тема, Query, PWA)
│   └── pages/        #   Страничные контейнеры
├── hooks/            # React-хуки (useJournalPage, useAdminPage, useDebounce)
├── lib/              # Бизнес-логика
│   ├── db/           #   Drizzle + Prisma (Hybrid Persistence)
│   ├── auth/         #   NextAuth (Hiddify Token + Legacy Password)
│   ├── security/     #   Валидация, Rate Limiting, заголовки
│   ├── excel/        #   Импорт из Excel (парсеры, маппинг, AI)
│   ├── api/          #   API-клиент, shared helpers
│   ├── utils/        #   Утилиты (cn, cache, export, favorites)
│   ├── animations/   #   Физический движок жидкости (SVG-колба)
│   └── bio-analytics/#   Детекция выбросов в данных
├── types/            # Глобальные TypeScript-типы
├── prisma/           # Prisma Schema + миграции
├── scripts/          # Скрипты (audit, ci, db, dev, setup, utils)
├── tests/            # Тесты (e2e, unit, integration)
├── docs/             # Документация (архитектура, БД, установка)
└── public/           # Статика (иконки, manifest, service worker)
```

Подробная навигация — [`MAP.md`](MAP.md).

## Основные команды

| Команда | Описание |
| :--- | :--- |
| `npm run dev` | Запуск в режиме разработки (Turbopack + meta-sync) |
| `npm run build` | Сборка production-бандла |
| `npm run check` | TypeScript type-check (`tsc --noEmit`) |
| `npm run lint` | Проверка кода через Biome |
| `npm run format` | Форматирование кода через Biome |
| `npm test` | Запуск unit-тестов (Vitest) |
| `npm run db:backup` | Создание дампа SQLite-базы |
| `npm run db:seed-export` | Экспорт данных в JSON (seed) |
| `npm run setup` | Первоначальная настройка проекта |
| `npm run auth` | Генерация одноразового токена авторизации |
| `npm run prisma:migrate` | Создание новой миграции Prisma |
| `npm run prisma:studio` | Визуальный просмотр базы данных |

## Архитектура

### Hybrid Persistence

Проект использует двойной ORM-стек:

- **Prisma** — определение схемы, миграции, сложные мутации
- **Drizzle ORM** — чтение данных (hot path), серверная пагинация, фильтрация

Оба подключаются к одной SQLite-базе через LibSQL.

### Data Flow

```text
[UI] → TanStack Query → [API Routes] → Drizzle (read) / Prisma (write) → [SQLite]
```

### Компонентная архитектура

- **App Router** — серверные и клиентские компоненты, Server Actions
- **Barrel-экспорты** — `components/*/index.ts`, `hooks/index.ts`, `lib/utils/index.ts`
- **CVA** — варианты компонентов через `class-variance-authority`
- **Framer Motion** — анимации переходов, микро-анимации

## Развёртывание

### Docker

```bash
docker compose up -d --build
```

- **Image**: `ghcr.io/kmnnw1/lims-dna-journal:alpha`
- **Database**: SQLite (монтирование в `/data/dev.db`)

### Переменные среды

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

Шаблон — `.env.example`.

## Синхронизация

```bash
git fetch origin && git add -A && (git diff --staged --quiet || git stash push -m "pavel-sync") && git reset --hard origin/main && (git stash list --max-count=1 | grep -q "pavel-sync" && git stash pop || true)
```

## Документация

| Документ | Описание |
| :--- | :--- |
| [`MAP.md`](MAP.md) | Навигационная карта проекта (все файлы) |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Архитектура и конвенции |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Схема базы данных |
| [`docs/SETUP.md`](docs/SETUP.md) | Руководство по установке |
| [`TODO.md`](TODO.md) | Дорожная карта развития |

## Лицензия

[LICENSE.md](LICENSE.md)
