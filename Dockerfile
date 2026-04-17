# Stage 1: Dependencies
FROM node:22-bookworm-slim AS deps
WORKDIR /app

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apt-get update && apt-get install -y --no-install-recommends libc6-compat && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Сначала генерируем клиент Prisma, чтобы сборка Next.js видела типы
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Создаем пользователя для безопасности
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

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
