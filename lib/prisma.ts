import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// 1. ГЛАВНЫЙ ФИКС: Внедряем переменную окружения прямо в процесс ДО создания адаптера.
// Это защищает нас от бага в @prisma/adapter-better-sqlite3 (строка 622),
// который падает с ошибкой 'replace', если Next.js еще не успел подгрузить .env
if (!process.env.DATABASE_URL) {
	process.env.DATABASE_URL = 'file:./prisma/dev.db';
}

// 2. Абсолютный путь для драйвера
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const sqlite = new Database(dbPath);

// 3. Инициализируем адаптер (теперь он 100% найдет строку и не упадет)
const adapter = new PrismaBetterSqlite3(sqlite as any);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
