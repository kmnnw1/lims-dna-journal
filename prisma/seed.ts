import { PrismaClient } from '@/prisma/generated/client';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

/**
 * Скрипт для заполнения (сидирования) базы данных из файла snapshots/seed.json.
 * Позволяет восстановить состояние БД после сброса.
 */
async function main() {
	const dataPath = join(__dirname, 'seed.json');

	if (!existsSync(dataPath)) {
		console.warn('⚠️ Файл prisma/seed.json не найден. Пропускаю сидирование.');
		return;
	}

	console.log('🔄 Начинаю восстановление данных из снимка...');

	try {
		const raw = readFileSync(dataPath, 'utf8');
		const { users, specimens, pcrAttempts } = JSON.parse(raw);

		// 1. Восстанавливаем пользователей
		if (users?.length) {
			console.log(`📦 Загружаю ${users.length} пользователей...`);
			for (const u of users) {
				await prisma.user.upsert({
					where: { username: u.username },
					update: u,
					create: u,
				});
			}
		}

		// 2. Восстанавливаем пробы (Specimens)
		if (specimens?.length) {
			console.log(`📦 Загружаю ${specimens.length} проб...`);
			for (const s of specimens) {
				await prisma.specimen.upsert({
					where: { id: s.id },
					update: s,
					create: s,
				});
			}
		}

		// 3. Восстанавливаем результаты ПЦР (PcrAttempt)
		if (pcrAttempts?.length) {
			console.log(`📦 Загружаю ${pcrAttempts.length} попыток ПЦР...`);
			for (const p of pcrAttempts) {
				await prisma.pcrAttempt.upsert({
					where: { id: p.id },
					update: p,
					create: p,
				});
			}
		}

		console.log('✅ Восстановление завершено успешно!');
	} catch (e) {
		console.error('❌ Ошибка при сидировании:', e);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
