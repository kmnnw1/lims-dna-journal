import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('Шифруем пароль...');
	const hashedPassword = await bcrypt.hash('admin', 10);

	const admin = await prisma.user.upsert({
		where: { username: 'admin' },
		update: { password: hashedPassword },
		create: {
			username: 'admin',
			password: hashedPassword,
			role: 'ADMIN',
		},
	});
	console.log('Успех! Зашифрованный админ готов:', admin.username);

	// === НОВЫЙ БЛОК ДЛЯ GITHUB ACTIONS ===
	// Проверяем, пустая ли база. Если пустая — создаем тестовые данные для робота.
	const count = await prisma.specimen.count();
	if (count === 0) {
		console.log('База пуста. Добавляем тестовые пробы для Playwright...');
		await prisma.specimen.createMany({
			data: [
				{ id: 'AP1932', taxon: 'Aspicilia asiatica', locality: 'Altai' },
				{ id: 'TEST-001', taxon: 'Test Taxon 1', locality: 'Lab 1' },
				{ id: 'TEST-002', taxon: 'Test Taxon 2', locality: 'Lab 2' },
			],
		});
		console.log('Тестовые пробы успешно добавлены!');
	}

	// === ПОДГОТОВКА ТОКЕНОВ ДЛЯ CI/CD ===
	const testToken = process.env.AUTH_TEST_TOKEN || 'test-token-123';
	console.log(`Подготовка тестового токена: ${testToken}`);

	await prisma.authToken.upsert({
		where: { token: testToken },
		update: {
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 часа
			used: false,
		},
		create: {
			token: testToken,
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
			used: false,
		},
	});
	console.log('Тестовый токен готов к использованию!');
}

main()
	.catch((e) => {
		console.error('Ошибка скрипта:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
