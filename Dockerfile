# Образ для самостоятельного развёртывания (Linux-сервер с Docker).
#   docker compose up --build
#
# Перед первым запуском создайте .env рядом с compose (см. .env.example).

FROM node:20-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY . .

RUN npx prisma generate && npm run build && npm prune --omit=dev

ENV DATABASE_URL=file:/data/dev.db
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN mkdir -p /data && chown -R node:node /data /app
USER node

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && npm run start"]
