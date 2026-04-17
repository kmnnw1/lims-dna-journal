import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '../prisma/generated/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const prisma = new PrismaClient();

/**
 * Скрипт для создания "снимка" базы данных в формате JSON.
 * Эти данные будут использоваться для повторного сидирования (восстановления).
 */
async function main() {
	console.log('🔄 Начинаю экспорт данных...');

	try {
		const users = await prisma.user.findMany();
		const specimens = await prisma.specimen.findMany();
		const pcrAttempts = await prisma.pcrAttempt.findMany();

		const backup = {
			users,
			specimens,
			pcrAttempts,
			exportedAt: new Date().toISOString(),
		};

		const backupPath = join(root, 'prisma', 'seed.json');
		writeFileSync(backupPath, JSON.stringify(backup, null, '\t') + '\n');

		console.log(`✅ Бекап успешно создан: ${backupPath}`);
		console.log(
			`📊 Экспортировано: ${users.length} пользователей, ${specimens.length} проб, ${pcrAttempts.length} ПЦР-попыток.`,
		);
	} catch (e) {
		console.error('❌ Ошибка при создании бекапа:', e);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
