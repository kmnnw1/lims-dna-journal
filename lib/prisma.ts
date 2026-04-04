/** Гарантирует единственный инстанс PrismaClient даже при hot reload в dev.
 *  См. https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prevent-hot-reloading-from-creating-new-instances
 */
import { PrismaClient } from "@prisma/client";

/** Тип глобального кэша для Prisma — безопасно расширяет Node.js globalThis */
type GlobalPrisma = typeof globalThis & { __prisma?: PrismaClient };

// Используем кастомное свойство с "__" чтобы избежать случайных конфликтов
const globalWithPrisma = globalThis as GlobalPrisma;

let prisma: PrismaClient;

if (!globalWithPrisma.__prisma) {
  globalWithPrisma.__prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

prisma = globalWithPrisma.__prisma;

// Экспорт для использования во всём проекте
export { prisma };
