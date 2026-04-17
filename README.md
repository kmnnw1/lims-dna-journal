# LIMS | DNA Lab Journal 🧬

Система управления лабораторной информацией для автоматизации учета биологических проб, экстракции ДНК и мониторинга процессов ПЦР. 

## 🚀 Технологическая Экосистема

| Слой | Технология | Описание |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.2 (Turbopack) | Реактивный App Router и серверные компоненты |
| **Data Fetching** | **TanStack Query v5** | Ультимативное кеширование и синхронизация серверного состояния |
| **ORM / DB** | Prisma 7 + **Drizzle ORM** | Prisma для схем, Drizzle для сверхбыстрых SQL-запросов |
| **Aesthetics** | **Framer Motion** | Современные анимации и переходы |
| **Lint/Format** | **Biome (Rust-based)** | Мгновенный линтинг и форматирование |
| **Security** | **Husky + Tsc** | Гарантия Type Safety при каждом коммите |

## 🛠 Инженерные Инструменты

| Команда | Что делает? |
| :--- | :--- |
| `npm run dev` | Запуск среды разработки с автоматическим обслуживанием метаданных. |
| `npm run check` | Полная проверка проекта: **Biome Lint** + **TypeScript Type Check**. |
| `npm run format` | Мгновенное форматирование всего кода. |
| `npm run backup` | Создание снимка базы данных. |
| `npm run auth` | CLI-инструмент для управления пользователями. |

## 💡 Особенности проекта

- **Strict Mode**: Проект настроен на соблюдение строгих стандартов типизации и форматирования.
- **Auto-Sync**: Локальные метаданные и бэкапы синхронизируются в фоновом режиме.
- **IDE Ready**: Включена преднастроенная конфигурация для VS Code (Biome, Tailwind, Prisma).

## 🧬 Инструкция для синхронизации

```bash
git fetch origin && git add -A && (git diff --staged --quiet || git stash push -m "pavel-sync") && git reset --hard origin/main && (git stash list --max-count=1 | grep -q "pavel-sync" && git stash pop || true)
```

## 📦 Развертывание (Docker)
- Изображение: `ghcr.io/kmnnw1/lims-dna-journal:alpha`
- База данных (SQLite) монтируется как том в `/data`.

---
© 2026 DNA Lab | Professional Laboratory Information Management System
