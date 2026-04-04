# Продвинутый Dockerfile для самостоятельного деплоя (Linux-сервер, поддержка production best practices)
#   docker compose up --build
# NB: .env должен быть рядом с docker-compose.yaml (см. .env.example)

FROM node:20-bookworm-slim

# 1. Установка зависимостей отдельно (лучше слои кэша для prod/stage)
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Копируем только необходимые файлы для npm install
COPY package.json package-lock.json ./

# --force полу-защитит от peer/warn и ускорит layer reuse при нестрогой совместимости
RUN npm ci --omit=dev

# 2. Копируем только нужные директории (ускоряет сборку, не тащит тесты/мусор)
COPY prisma ./prisma
COPY public ./public
COPY src ./src
COPY .next ./.next
COPY next.config.* ./
COPY tsconfig*.json ./
COPY .env.example ./

# 3. Генерируем Prisma client и передаём всю сборку на следующий multi-stage для "чистой" финальной среды
RUN npx prisma generate

# 4. Собираем приложение
RUN npm run build

# 5. Очищаем dev-зависимости (ещё минус размер)
RUN npm prune --omit=dev

# 6. Переменные окружения для Next.js/Prisma (можно переопределять внешне)
ENV DATABASE_URL=file:/data/dev.db
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 7. Настраиваем права безопасно
RUN mkdir -p /data && chown -R node:node /data /app

USER node

EXPOSE 3000

# 8. Лёгкий старт: прокидывает миграции и стартует app. Можно делать ENTRYPOINT-скрипт для гибкости.
CMD npx prisma db push && npm run start
