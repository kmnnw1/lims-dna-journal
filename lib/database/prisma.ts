import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Централизованный экземпляр Prisma Client.
 * Настроен на минимальное логирование и использование адаптера.
 */
export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		adapter,
		log: ['error'],
	});

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
