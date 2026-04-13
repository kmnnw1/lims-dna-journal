# Dockerfile для production-сборки. Использует интуитивный путь импорта /data/data.xlsx.
# Запуск:
#   docker compose up --build
# В контейнере данные и файл импорта доступны через том lab-data -> /data.

FROM node:20-bookworm-slim AS build
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_XLSX_PATH=/data/data.xlsx
ENV DATABASE_URL=file:/data/dev.db
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/app ./app
COPY --from=build /app/components ./components
COPY --from=build /app/hooks ./hooks
COPY --from=build /app/lib ./lib
COPY --from=build /app/types ./types
COPY --from=build /app/next.config.ts ./
COPY --from=build /app/postcss.config.mjs ./
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/next-env.d.ts ./

RUN mkdir -p /data && chown -R node:node /data /app
VOLUME ["/data"]
USER node
EXPOSE 3000
ENTRYPOINT ["sh", "-c", "npx prisma db push && npm run start"]
