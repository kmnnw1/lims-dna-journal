# 📍 Навигация по проекту

> LIMS DNA Lab Journal — система учёта биологических проб, экстракции ДНК, протоколирования ПЦР.
> Next.js 16 · Prisma 7 · Drizzle ORM · TanStack Query 5 · Framer Motion · Tailwind CSS 4

---

## 🧬 Ядро приложения

### `app/` — Next.js App Router

| Путь | Назначение |
| :--- | :--- |
| `page.tsx` | Главная (redirect → журнал) |
| `layout.tsx` | Root layout, шрифты, metadata |
| `globals.css` | Базовые стили, скроллбары, ресеты (импорт в theme/utils/anim) |
| `theme.css` | MD3 токены (цвета, motion, shape) |
| `utilities.css` | MD3 утилиты (elevations, typography) |
| `animations.css` | Keyframes и View Transitions |
| `login/page.tsx` | Страница авторизации (Hiddify Token) |
| `admin/page.tsx` | Панель администрирования |
| `admin/audit/` | Журнал аудита действий |
| `actions/theme.ts` | Server Action для темы |

### `app/api/` — REST API

| Route | Методы | Что делает |
| :--- | :--- | :--- |
| `specimens/` | GET POST PUT DELETE | CRUD проб (Drizzle read, Prisma write) |
| `pcr/` | POST | Создание ПЦР-попытки |
| `pcr/batch/` | POST | Массовая ПЦР |
| `import/` | POST | Импорт из Excel |
| `export/db/` | GET | Экспорт базы |
| `history/` | GET | История изменений пробы |
| `auth/[...nextauth]/` | * | NextAuth endpoints |
| `users/` | GET POST PUT | Управление пользователями |
| `users/bulk/` | POST | Массовый импорт пользователей |
| `audit/` | GET | Аудит-лог |
| `presence/` | POST | Онлайн-присутствие |
| `backup/download/` | GET | Скачивание бэкапа |
| `upload/feedback/` | POST | Загрузка обратной связи |
| `health/` | GET | Healthcheck |
| `ota/` | GET | OTA-обновления |

---

## 🧩 Компоненты

### `components/pages/` — Страницы (контейнеры)

| Файл | Строки | Описание |
| :--- | :--- | :--- |
| `JournalPageContent.tsx` | ~320 | Главная страница журнала проб (оркестратор) |
| `AdminPageContent.tsx` | 307 | Администрирование пользователей |
| `AdminUserRow.tsx` | — | Строка пользователя в админке |

### `components/features/` — Feature-компоненты

| Файл | Описание |
| :--- | :--- |
| `SpecimenTable.tsx` | Таблица проб (десктоп) |
| `MobileSpecimenCard.tsx` | Карточка пробы (мобильное) |
| `QuickFilterBar.tsx` | Панель быстрых фильтров |
| `PaginationControls.tsx` | Пагинация |
| `JournalHeader.tsx` | Шапка журнала (статистика, поиск) |
| `StatsCards.tsx` | Карточки статистики |
| `HistoryDialog.tsx` | Диалог истории изменений |
| `JournalToolbar.tsx` | Панель инструментов (экспорт, пагинация) |
| `SelectionBar.tsx` | Панель действий при выделении строк |
| `BarcodeScanDialog.tsx` | Сканер штрих-кодов |
| `ERModelVisualizer.tsx` | Визуализация ER-модели БД |
| `DevOverlay.tsx` | Оверлей разработчика |
| `DevToolsButton.tsx` | Кнопка DevTools (Vercel-style) |
| `DevSettingsProvider.tsx` | Провайдер настроек разработки |
| `DevHotkeys.tsx` | Горячие клавиши разработчика |
| `LogViewer.tsx` | Просмотр логов |
| `PCRStatusBadge.tsx` | Бейдж статуса ПЦР |
| `AlphaFeedbackCell.tsx` | Форма обратной связи (alpha) |
| `GlobalLensDrops.tsx` | Декоративные анимации |
| `PresenceProvider.tsx` | Провайдер присутствия |
| `OfflineIndicator.tsx` | Индикатор offline |
| `ThemeToggle.tsx` | Переключатель темы |

### `components/ui/` — Базовые UI-примитивы

| Файл | Описание |
| :--- | :--- |
| `Button.tsx` | Кнопка (CVA-варианты) |
| `Card.tsx` | Карточка |
| `FAB.tsx` | Floating Action Button |
| `TextField.tsx` | Текстовое поле |
| `MD3Field.tsx` | Material Design 3 поле |
| `Skeleton.tsx` | Скелетон загрузки |
| `HighlightMatch.tsx` | Подсветка совпадений поиска |
| `ContextMenu.tsx` | Контекстное меню |
| `CommandPalette.tsx` | Cmd+K палитра команд |
| `AnimatedFlask.tsx` | SVG-анимация колбы (физика жидкости) |
| `InteractiveFluidFlask.tsx` | Интерактивная версия колбы |

### `components/modals/` — Модальные окна

| Файл | Описание |
| :--- | :--- |
| `AddSpecimenModal.tsx` | Создание новой пробы |
| `EditSpecimenModal.tsx` | Редактирование пробы (475 строк) |
| `PCRModal.tsx` | Запись ПЦР-реакции |
| `BatchPCRModal.tsx` | Массовая ПЦР |
| `ShortcutsModal.tsx` | Справка по горячим клавишам |

### `components/layout/` — Layout-провайдеры

| Файл | Описание |
| :--- | :--- |
| `Providers.tsx` | Композиция провайдеров |
| `QueryProvider.tsx` | TanStack Query |
| `ThemeProvider.tsx` | Тема (dark/light) |
| `PageTransition.tsx` | Анимация перехода страниц |
| `PwaBootstrap.tsx` | PWA-инициализация |

---

## 🪝 Хуки

| Файл | Строки | Описание |
| :--- | :--- | :--- |
| `useJournalPage.ts` | ~250 | Оркестратор страницы (делегирует мутации и hotkeys) |
| `useSpecimenMutations.ts` | ~150 | Мутации проб (add, edit, pcr) |
| `useJournalHotkeys.ts` | ~100 | Клавиатурная навигация и горячие клавиши |
| `useAdminPage.ts` | 277 | Логика страницы администрирования |
| `useDebounce.ts` | — | Debounce-хук |
| `usePullToRefresh.ts` | — | Pull-to-Refresh (мобильное) |
| `usePwaInstall.ts` | — | PWA install prompt |

---

## 📚 Библиотеки (`lib/`)

### `lib/db/` — Слой данных

| Путь | Описание |
| :--- | :--- |
| `drizzle/drizzle.ts` | Инициализация Drizzle (LibSQL) |
| `drizzle/schema.ts` | Drizzle-схема (specimens, users, audit) |
| `prisma/prisma.ts` | Инициализация Prisma (better-sqlite3 adapter) |
| `prisma/audit-log.ts` | Логирование действий (GLP) |

### `lib/auth/` — Авторизация

| Путь | Описание |
| :--- | :--- |
| `core.ts` | NextAuth config (Hiddify Token + Legacy Password) |
| `index.ts` | Re-export |

### `lib/security/` — Безопасность

| Путь | Описание |
| :--- | :--- |
| `input-validator.ts` | Валидация входных данных |
| `rate-limiter.ts` | Rate Limiting |
| `headers.ts` | Security Headers |
| `crypto-client.ts` | Клиентская криптография |

### `lib/excel/` — Импорт из Excel

| Путь | Описание |
| :--- | :--- |
| `index.ts` | Barrel |
| `cell-parsers.ts` | Парсеры ячеек |
| `row-parsers.ts` | Парсеры строк |
| `sheet-parsers.ts` | Парсеры листов |
| `database-import.ts` | Запись в БД |
| `merge-utils.ts` | Утилиты слияния данных |
| `ai-parser.ts` | AI-парсинг (Gemini) |
| `technician-resolver.ts` | Маппинг техников |
| `types.ts` | Типы Excel-импорта |

### `lib/animations/` — Анимации

| Путь | Описание |
| :--- | :--- |
| `fluid-engine.ts` | Физический движок жидкости (977 строк) |

### `lib/api/` — API-утилиты

| Путь | Описание |
| :--- | :--- |
| `api-client.ts` | Fetch-обёртка с retry |
| `helpers.ts` | Shared API helpers (cache, auth, errors) |

### `lib/utils/` — Утилиты

| Путь | Описание |
| :--- | :--- |
| `cn.ts` | `clsx` + `tailwind-merge` |
| `cache.ts` | In-memory cache |
| `export.ts` | Экспорт в Excel |
| `favorites.ts` | Избранные пробы (IndexedDB) |
| `index.ts` | Barrel |

### `lib/bio-analytics/` — Биоаналитика

| Путь | Описание |
| :--- | :--- |
| `outlier-detector.ts` | Определение выбросов в данных |

### `lib/shims/` — Полифилы

| Путь | Описание |
| :--- | :--- |
| Shim-файлы | Совместимость модулей |

### `lib/` — Standalone файлы

| Путь | Описание |
| :--- | :--- |
| `excel-backup.ts` | Бэкап Excel-данных |
| `translit.ts` | Транслитерация кириллицы |

---

## 🧪 Тесты

| Путь | Описание |
| :--- | :--- |
| `tests/e2e/journal.spec.ts` | Playwright E2E (журнал проб) |
| `tests/unit/` | Vitest unit-тесты |
| `tests/integration/api/` | Интеграционные тесты API |

---

## 🔧 Скрипты (`scripts/`)

| Группа | Файлы | Назначение |
| :--- | :--- | :--- |
| `audit/` | 9 | Аудит безопасности, ERD, QA, сбор логов |
| `ci/` | 3 | GitHub CI, статус, мониторинг |
| `db/` | 11 | Импорт, бэкап, сидинг, анализ Excel |
| `dev/` | 8 | Auth CLI, meta-sync, отладка |
| `setup/` | 5 | Установка, генерация PWA-иконок |
| `utils/` | 8 | Версионирование, рефакторинг, OTA |

---

## 📁 Прочее

| Путь | Описание |
| :--- | :--- |
| `prisma/schema.prisma` | Prisma Schema (Specimen, User, PCR, Audit...) |
| `prisma/migrations/` | SQL-миграции |
| `types/index.ts` | Глобальные TypeScript-типы |
| `proxy.ts` | Dev-прокси (конфликт с middleware.ts!) |
| `data/` | Исходные данные (Excel, дампы) |
| `docs/` | Архитектура, база данных, установка |
| `public/` | Статика (иконки, manifest) |
