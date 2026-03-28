# Журнал проб ДНК (lab-journal)

[![Node.js](https://img.shields.io/badge/node.js-%3E%3D20-417505?logo=node.js&logoColor=white)](https://nodejs.org/en/download)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/docs)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/docs)

Веб-приложение для учёта проб, выделения ДНК и журнала ПЦР: таблица проб, роли пользователей, импорт из Excel, экспорт и печать. Подходит для развёртывания во внутренней сети лаборатории или на сервере с доступом по HTTPS.

**Стек:** Next.js 16 (App Router), TypeScript, Prisma, SQLite (типичная среда разработки), NextAuth.js, Tailwind CSS.

---

## Развёртывание «под ключ» (без участия разработчиков)

### Один запуск после клонирования (Node.js 20+ уже установлен)

Из корня репозитория:

```bash
node scripts/install-all.mjs
```

Скрипт последовательно выполняет `npm install`, создаёт `.env` из `.env.example` при отсутствии, при необходимости генерирует `NEXTAUTH_SECRET`, затем `prisma generate`, `prisma db push`, `npm run build` и запускает `npm start`. Остановка сервера: `Ctrl+C`.

Эквивалент вручную: `npm install` → `npm run setup` → `npm start`.

На **Windows** можно вызвать: `powershell -ExecutionPolicy Bypass -File scripts/install.ps1`.  
На **Linux/macOS**: `chmod +x scripts/install.sh && ./scripts/install.sh`.

### Docker (Linux-сервер с установленным Docker)

```bash
cp .env.example .env
# Укажите в .env NEXTAUTH_SECRET и при публичном URL — NEXTAUTH_URL (например https://журнал.лаборатория.локально)
mkdir -p lab-data
# При необходимости положите файл импорта как lab-data/data.xlsx (путь задан в docker-compose)
docker compose up --build
```

База SQLite хранится в томе `./lab-data` (каталог в `.gitignore`). Переменная `DATA_XLSX_PATH` в compose указывает на `/data/data.xlsx`.

### Контроль работоспособности

HTTP `GET /api/health` — JSON с полем `ok`, версией из `package.json` и меткой времени (удобно для мониторинга и проверки после установки).

---

## Возможности

| Область | Описание |
|---------|----------|
| Учёт проб | Идентификатор, таксон, место, лаборатория и оператор выделения, метод, концентрация ДНК, заметки, ссылка на изображение геля |
| Маркер ITS | Циклические статусы качества (успех / ошибка / «чужой») с быстрым переключением |
| ПЦР | Несколько попыток на пробу: объём, результат, опционально маркер и праймеры |
| Роли | `ADMIN` — пользователи, импорт, очистка таблицы, массовое удаление; `EDITOR` — редактирование; `READER` — только просмотр |
| Данные | Импорт из `data.xlsx` (корень проекта), экспорт таблицы в `.xlsx`, печать текущего вида |

---

## Быстрый старт

### 1. Зависимости

Требуется **Node.js 20+** ([официальная сборка](https://nodejs.org/en/download)).

### 2. Клонирование и зависимости

```bash
git clone <url-репозитория> lab-journal
cd lab-journal
npm install
```

### 3. Переменные окружения

```bash
cp .env.example .env
```

Минимальное содержимое `.env`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="<случайная строка: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

`DATABASE_URL` задаёт файл SQLite относительно каталога `prisma/`. Файл `.env` не коммитится.

Опционально: `DATA_XLSX_PATH` — путь к файлу импорта (по умолчанию `data.xlsx` в корне проекта; для нестандартного расположения укажите абсолютный или относительный путь).

### 4. База данных и режим разработки

Первый раз после `npm install` и настройки `.env`:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Интерфейс разработки: [http://localhost:3000](http://localhost:3000). При пустой таблице пользователей допускается первый вход `admin` / `admin` (создаётся учётная запись администратора).

Для **production** на новой машине (сборка и запуск) используйте `npm run setup`, затем `npm start`, либо одну команду `node scripts/install-all.mjs` (см. раздел выше).

### 5. Импорт из Excel

По умолчанию ожидается файл **`data.xlsx`** в корне проекта (расширение `.xlsx` в `.gitignore`). Импорт запускается из раздела администратора. Путь переопределяется переменной `DATA_XLSX_PATH`.

---

## Сборка и production

```bash
npm run build
npm run start
```

Порт задаётся переменной окружения `PORT` (по умолчанию 3000). Для внешнего доступа задайте корректный `NEXTAUTH_URL` (публичный URL сервиса). При переходе на [PostgreSQL](https://www.prisma.io/docs/orm/overview/databases/postgresql) измените `DATABASE_URL` и провайдер в `prisma/schema.prisma`, затем выполните миграции Prisma.

---

## Резервное копирование SQLite

```bash
npm run backup
```

Создаётся копия `prisma/dev.db` в каталоге `backups/` с меткой времени в имени файла. Каталог `backups/` в `.gitignore`.

---

## Поведение без сети и параллельное редактирование

Клиент обращается к API на том же хосте, что и интерфейс. При отсутствии сети запросы не выполняются: **изменения не сохраняются** до восстановления связи. Отдельной офлайн-очереди и автоматической синхронизации нет.

Несколько операторов, работающих онлайн, изменяют одну и ту же запись последовательно: действует последнее успешное сохранение на сервере. Для строгого разрешения конфликтов потребовались бы версии записей или иной протокол слияния — это не реализовано в текущей версии.

---

## Команды npm

| Команда | Назначение |
|---------|------------|
| `npm run dev` | Режим разработки с hot reload |
| `npm run setup` | Prisma + сборка (подготовка к `npm start`) |
| `npm run install:all` | То же, что `node scripts/install-all.mjs` |
| `npm run build` | Production-сборка |
| `npm run start` | Запуск после `build` |
| `npm run lint` | Проверка ESLint |
| `npm run backup` | Резервная копия SQLite (`scripts/backup-db.mjs`) |

---

## Структура репозитория (сводка)

| Путь | Назначение |
|------|------------|
| `app/` | Страницы и маршруты API Next.js |
| `prisma/schema.prisma` | Модель данных |
| `lib/` | Prisma-клиент, аутентификация, импорт Excel |
| `scripts/backup-db.mjs` | Резервное копирование БД |
| `scripts/setup.mjs` | Автоматическая подготовка окружения |
| `scripts/install-all.mjs` | Установка зависимостей + setup + запуск |
| `Dockerfile`, `docker-compose.yml` | Контейнерный запуск |

Файлы с секретами, выгрузки Excel с данными и вспомогательные каталоги вроде `local/` намеренно не включены в публичный снимок репозитория (см. `.gitignore`).

---

## Лицензия и владение

Проект распространяется в составе учебной или внутренней инфраструктуры; при добавлении лицензии укажите её в корне репозитория отдельным файлом `LICENSE`.
