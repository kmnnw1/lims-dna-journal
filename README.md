# LIMS | DNA Lab Journal

Система управления лабораторной информацией для автоматизации учета биологических проб, экстракции ДНК и мониторинга процессов ПЦР. Проект построен на принципах **State-of-the-Art (2026)** производительности и эстетики MD3.

## 🚀 Технологическая Экосистема

| Слой | Технология | Описание |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.2 (Turbopack) | Реактивный App Router и серверные компоненты |
| **Data Fetching** | **TanStack Query v5** | Ультимативное кеширование и синхронизация серверного состояния |
| **ORM / DB** | Prisma 7 + **Drizzle ORM** | Prisma для схем, Drizzle для сверхбыстрых SQL-выборки |
| **Aesthetics** | **Framer Motion** | Премиальные физически-корректные анимации и переходы |
| **Lint/Format** | **Biome (Rust-based)** | Мгновенный линтинг и форматирование (в 100 раз быстрее Prettier) |
| **Styling** | Tailwind CSS v4 | Современные токены Material Design 3 |

## 🛠 Командный Интерфейс (Scripts)

| Команда | Назначение |
| :--- | :--- |
| `npm run check` | **Ультимативная проверка кода** (Biome Lint + TypeScript Check) |
| `npm run dev` | Запуск сервера разработки |
| `npm run backup` | Создание снимка базы данных в `prisma/seed.json` |
| `npx prisma db seed` | Восстановление базы данных из последнего снимка |
| `npm run format` | Принудительное форматирование всего проекта через Biome |

## 🧬 Инструкция для синхронизации (Павел сюда!)

Если проект обновился «сильно» (были правки истории Git или тяжелые миграции), используйте эту команду для чистой синхронизации:

```bash
git fetch origin && git add -A && (git diff --staged --quiet || git stash push -m "pavel-sync") && git reset --hard origin/main && (git stash list --max-count=1 | grep -q "pavel-sync" && git stash pop || true)
```

## 📦 Развертывание (Docker)

Проект полностью контейнеризирован и готов к деплою в GHCR:
- Изображение: `ghcr.io/kmnnw1/lims-dna-journal:alpha`
- Использует **Node.js 22** для максимальной скорости V8.
- База данных (SQLite) монтируется как том в `/data`.

## 📂 Структура данных

- `prisma/`: Схемы данных Prisma и скрипты сидирования.
- `drizzle/`: Описания для быстрого доступа к БД через Drizzle.
- `scripts/`: Инженерные инструменты (бакап, версионирование, генерация иконок).
- `components/layout/QueryProvider.tsx`: Сердце управления данными (TanStack Query).

---
© 2026 DNA Lab | Professional Laboratory Information Management System
