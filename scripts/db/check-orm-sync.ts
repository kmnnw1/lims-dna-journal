import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Скрипт проверки синхронизации Prisma и Drizzle.
 * Сравнивает список моделей в schema.prisma и таблиц в lib/db/schema.ts.
 */

const PRISMA_PATH = join(process.cwd(), 'prisma', 'schema.prisma');
const DRIZZLE_PATH = join(process.cwd(), 'lib', 'db', 'schema.ts');

async function checkSync() {
	console.log('🔍 Проверка синхронизации ORM (Prisma ↔ Drizzle)...');

	try {
		const prismaContent = await fs.readFile(PRISMA_PATH, 'utf-8');
		const drizzleContent = await fs.readFile(DRIZZLE_PATH, 'utf-8');

		// Парсинг моделей Prisma (model Name {)
		const prismaModels = [...prismaContent.matchAll(/model\s+(\w+)\s+{/g)].map((m) => m[1]);

		// Парсинг таблиц Drizzle (export const name = sqliteTable('table_name')
		// Ищем именно 'table_name' внутри sqliteTable
		const drizzleTables = [...drizzleContent.matchAll(/sqliteTable\(['"](\w+)['"]/g)].map(
			(m) => {
				// Приводим к CamelCase или сравниваем как есть (в Prisma обычно CamelCase, в БД snake_case)
				// Но обычно они должны совпадать по смыслу.
				return m[1];
			},
		);

		// Нормализация для сравнения (Prisma обычно с большой буквы, в БД с маленькой)
		const pNormalized = prismaModels.map((m) => m.toLowerCase());
		const dNormalized = drizzleTables.map((m) => m.toLowerCase());

		const missingInDrizzle = prismaModels.filter((m) => !dNormalized.includes(m.toLowerCase()));
		const missingInPrisma = drizzleTables.filter((m) => !pNormalized.includes(m.toLowerCase()));

		if (missingInDrizzle.length === 0 && missingInPrisma.length === 0) {
			console.log('✅ Все модели синхронизированы!');
		} else {
			if (missingInDrizzle.length > 0) {
				console.warn(
					'⚠️  Модели в Prisma, отсутствующие в Drizzle:',
					missingInDrizzle.join(', '),
				);
			}
			if (missingInPrisma.length > 0) {
				console.warn(
					'⚠️  Таблицы в Drizzle, отсутствующие в Prisma:',
					missingInPrisma.join(', '),
				);
			}
		}
	} catch (e) {
		console.error('❌ Ошибка при проверке:', e);
	}
}

checkSync();
