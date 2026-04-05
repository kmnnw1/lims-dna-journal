import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// 1. Абсолютный путь для драйвера
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const sqlite = new Database(dbPath);

// Используем 'as any' для обхода временного конфликта типов Prisma 7
const adapter = new PrismaBetterSqlite3(sqlite as any);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		adapter,
		datasources: {
			db: {
				url: 'file:./prisma/dev.db',
			},
		},
	} as any); // <-- Вот он, спасительный каст, который уберет ошибку!

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
