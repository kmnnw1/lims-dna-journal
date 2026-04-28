# Руководство по установке

## Системные требования

- **Node.js 24+** — [nodejs.org](https://nodejs.org/en/download)
- **npm 10+** — устанавливается с Node.js
- **Git** — для клонирования репозитория
- **Docker** (опционально) — для контейнерного развёртывания

## Локальная установка

### 1. Клонирование репозитория

```bash
git clone <repository-url> lab-journal
cd lab-journal
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка проекта

Автоматическая первоначальная настройка:

```bash
npm run setup
```

Скрипт выполнит:

- Создание `.env` с криптографическим ключом
- Генерацию Prisma-клиента
- Применение схемы базы данных (SQLite)
- Создание начальной базы `dev.db`

### 4. Запуск

```bash
npm run dev
```

Приложение доступно по адресу `http://localhost:3000` (и в локальной сети на `0.0.0.0:3000`).

### 5. Авторизация

Проект использует одноразовые токены (Hiddify-стиль). Для создания токена:

```bash
npm run auth
```

CLI создаст временный токен, который можно использовать для входа на странице `/login`.

## Переменные среды

Шаблон — `.env.example`. Основные переменные:

```env
# База данных
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_SECRET="<сгенерируйте: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

Генерация секрета:

```bash
openssl rand -base64 32
```

## Docker

### Сборка и запуск

```bash
docker compose up -d --build
```

Приложение запустится на порте, указанном в `docker-compose.yml`.

### Конфигурация

- **Image**: `ghcr.io/kmnnw1/lims-dna-journal:alpha`
- **Database**: SQLite (монтирование тома в `/data/dev.db`)
- **Переменные**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

## Управление базой данных

### Бэкап

```bash
npm run db:backup
```

Дампы сохраняются в директорию `backups/`.

### Экспорт данных (JSON seed)

```bash
npm run db:seed-export
```

### Prisma Studio

Визуальный просмотр и редактирование данных:

```bash
npm run prisma:studio
```

### Миграции

```bash
# Создание миграции
npm run prisma:migrate

# Генерация клиента
npm run prisma:generate
```

## Импорт данных

### Импорт из Excel

1. Поместите файл `data.xlsx` в директорию `./data/`
2. Войдите как пользователь с ролью `ADMIN`
3. Перейдите в раздел «Администрирование»
4. Нажмите «Импорт» — данные будут разобраны и добавлены в базу

### Экспорт

Экспорт данных доступен через UI (кнопка экспорта в журнале).

## Тестирование

### Unit-тесты (Vitest)

```bash
npm test
```

### Интерфейс тестов

```bash
npm run test:ui
```

### Проверка типов

```bash
npm run check
```

## Все npm-скрипты

| Команда | Описание |
| :--- | :--- |
| `npm run dev` | Запуск dev-сервера (Turbopack + meta-sync) |
| `npm run dev:https` | Dev-сервер с HTTPS |
| `npm run build` | Production-сборка |
| `npm start` | Запуск production-сервера |
| `npm run check` | TypeScript type-check |
| `npm run check:watch` | TypeScript type-check (watch) |
| `npm run lint` | Проверка Biome |
| `npm run format` | Форматирование Biome |
| `npm test` | Unit-тесты (Vitest) |
| `npm run test:ui` | UI для тестов |
| `npm run db:backup` | Бэкап базы данных |
| `npm run db:seed-export` | Экспорт данных в JSON (seed) |
| `npm run db:analyze` | Анализ Excel-файлов |
| `npm run setup` | Первоначальная настройка |
| `npm run auth` | Генерация токена авторизации |
| `npm run bump` | Инкремент версии |
| `npm run icons` | Генерация PWA-иконок |
| `npm run logs:collect` | Сбор диагностических логов |
| `npm run ota:check` | Проверка OTA-обновлений |
| `npm run qa:copy` | Сбор ошибок для QA |
| `npm run prisma:studio` | Визуальный просмотр БД |
| `npm run prisma:migrate` | Создание миграции |
| `npm run prisma:generate` | Генерация Prisma-клиента |

## Устранение проблем

### Порт 3000 занят

```bash
npx kill-port 3000
```

### Проблемы с базой данных

1. Убедитесь, что файл `dev.db` существует в директории `prisma/`
2. Проверьте `DATABASE_URL` в `.env`
3. Пересоздайте базу:

   ```bash
   npx prisma db push --accept-data-loss
   ```

### Ошибки сборки

```bash
# Очистка кеша Next.js
Remove-Item -Recurse -Force .next   # Windows
rm -rf .next                         # macOS/Linux

npm run build
```

### Диагностика

```bash
npm run logs:collect
```

Создаёт диагностический пакет в `support/logs-<timestamp>/`.

## Связанные документы

- [ARCHITECTURE.md](ARCHITECTURE.md) — архитектура проекта
- [DATABASE.md](DATABASE.md) — схема базы данных
