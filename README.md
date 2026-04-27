# LIMS | DNA Lab Journal 🧬

Система управления лабораторной информацией для учета биологических проб, экстракции ДНК и мониторинга процессов ПЦР.

## Технический стек

| Характеристика | Технология |
| :--- | :--- |
| **Framework** | Next.js 16.2 (Turbopack) |
| **Data Fetching** | TanStack Query v5 |
| **ORM / DB** | Prisma 7 + Drizzle ORM |
| **E2E Testing** | Playwright |
| **Animations** | Framer Motion |
| **Linter / Formatter** | Biome |
| **Runtime** | Node.js 22 LTS |

## Основные команды

| Команда | Описание |
| :--- | :--- |
| `npm run dev` | Запуск в режиме разработки. |
| `npm run check` | Запуск Biome и tsc --noEmit. |
| `npm test:e2e` | Запуск E2E тестов в Playwright. |
| `npm run format` | Форматирование кода через Biome. |
| `npm run backup` | Создание дампа базы данных. |

## Спецификации и конфигурация

- **Build**: Использование Turbopack с алиасами для разрешения внешних зависимостей.
- **Data Flow**: Гибридное использование Prisma (миграции) и Drizzle (выполнение запросов).
- **Architecture**: App Router, серверные и клиентские компоненты.
- **Mobile Support**: Интеграция Barcode/QR сканера через браузерное API.

## Синхронизация

```bash
git fetch origin && git add -A && (git diff --staged --quiet || git stash push -m "pavel-sync") && git reset --hard origin/main && (git stash list --max-count=1 | grep -q "pavel-sync" && git stash pop || true)
```

## Развертывание

- **Docker Image**: `ghcr.io/kmnnw1/lims-dna-journal:alpha`
- **Database**: SQLite (монтирование в `/data/dev.db`).
- **Environment**: Требует настройки переменных AUTH и DATABASE_URL.
- **Scroll Behavior**: Иерархический липкий скролл (Sticky Stack) для удобства навигации в больших таблицах.

© 2007 DNA Lab
