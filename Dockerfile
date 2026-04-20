# Stage 1: Dependencies
FROM node:24-bookworm-slim AS deps
WORKDIR /app

# Глобально отключаем Husky и уведомления NPM для чистоты логов
ENV HUSKY=0
ENV npm_config_update_notifier=false

# Обновляем NPM до фиксированной стабильной версии через Corepack
RUN corepack enable npm && corepack prepare npm@11.12.0 --activate

# Установка зависимостей с использованием кэш-маунта BuildKit
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts --no-update-notifier

# Полноценная установка всех зависимостей (включая dev для сборки)
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-update-notifier

# Stage 2: Builder
FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Устанавливаем OpenSSL для Prisma с кэшированием APT
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y openssl --no-install-recommends

# Сначала генерируем клиент Prisma, чтобы сборка Next.js видела типы
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Устанавливаем OpenSSL для Prisma в рантайме (кэширование здесь менее важно, но полезно)
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Создаем пользователя для безопасности (используем ID 1001, стандарт для контейнеров)
RUN groupadd --gid 1001 nodejs
RUN useradd --uid 1001 --gid nodejs --no-create-home nextjs

# Копируем публичные ассеты и статику
COPY --from=builder /app/public ./public

# Настраиваем права для standalone папки
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Копируем результат standalone сборки
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Копируем Prisma для выполнения миграций/push при старте
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Создаем директорию для SQLite (должна быть примонтирована как Volume)
RUN mkdir -p /data && chown -R nextjs:nodejs /data
VOLUME ["/data"]

USER nextjs

EXPOSE 3000

# В standalone режиме запускаем через node server.js
# Предварительно накатываем схему БД
ENTRYPOINT ["sh", "-c", "npx prisma db push && node server.js"]
