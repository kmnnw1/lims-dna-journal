# LIMS | DNA Lab Journal 🧬

Система управления лабораторной информацией для автоматизации учета биологических проб, экстракции ДНК и мониторинга процессов ПЦР. 

> [!IMPORTANT]
> **Project Power Up (Modernization Phase 2.1)**: Проект переведен на автоматизированные рельсы безопасности. Все изменения в `THOUGHTS.md` теперь сохраняются автоматически, а код проходит двойную проверку перед коммитом.

## 🚀 Технологическая Экосистема

| Слой | Технология | Описание |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.2 (Turbopack) | Реактивный App Router и серверные компоненты |
| **Data Fetching** | **TanStack Query v5** | Ультимативное кеширование и синхронизация серверного состояния |
| **ORM / DB** | Prisma 7 + **Drizzle ORM** | Prisma для схем, Drizzle для сверхбыстрых SQL-запросов |
| **Aesthetics** | **Framer Motion** | Премиальные физически-корректные анимации и переходы |
| **Lint/Format** | **Biome (Rust-based)** | Мгновенный линтинг и форматирование (в 100 раз быстрее Prettier) |
| **Security** | **Husky + Tsc** | Гарантия 100% Type Safety при каждом коммите |

## 🛠 Инженерные Инструменты

| Команда | Что делает? |
| :--- | :--- |
| `npm run dev` | Запускает **Next.js**, **Демон бэкапа** и **Автосохранение мыслей** параллельно. |
| `npm run check` | Полная проверка проекта: **Biome Lint** + **TypeScript Type Check**. |
| `npm run format` | Мгновенно приводит весь код к идеальному состоянию. |
| `npm run backup` | Создает снимок базы данных. |
| `npm run auth` | CLI-инструмент для управления токенами и пользователями. |

## 💡 Система управления (Для Павла и Агентов)

1. **[THOUGHTS.md](file:///c:/Projects/Coursa2/lab-journal/THOUGHTS.md)**: "Коморка" Павла. Сюда пишем идеи, правила и фидбек. Скрипт `thoughts-autosave.ps1` следит за ним и комитит изменения каждые 5 минут.
2. **[AGENTS_UTF8.md](file:///c:/Projects/Coursa2/lab-journal/AGENTS_UTF8.md)**: "Священное Писание" для ИИ-агентов. Прочесть перед началом работы!
3. **[.vscode/](file:///c:/Projects/Coursa2/lab-journal/.vscode/)**: В репозиторий включены настройки для VS Code. Установите рекомендуемые расширения для лучшего опыта.

## 🧬 Инструкция для синхронизации

```bash
git fetch origin && git add -A && (git diff --staged --quiet || git stash push -m "pavel-sync") && git reset --hard origin/main && (git stash list --max-count=1 | grep -q "pavel-sync" && git stash pop || true)
```

## 📦 Развертывание (Docker)
- Изображение: `ghcr.io/kmnnw1/lims-dna-journal:alpha`
- База данных (SQLite) монтируется как том в `/data`.

---
© 2026 DNA Lab | Professional Laboratory Information Management System
