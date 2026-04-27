import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
	try {
		await prisma.specimen.upsert({
			where: { id: 'AP1932' },
			update: {},
			create: {
				id: 'AP1932',
				taxon: 'Amanita pantherina',
				locality: 'Moscow',
				extrLab: 'Main Lab',
				extrOperator: 'Admin',
				itsStatus: '✓',
			},
		});
		await prisma.authToken.upsert({
			where: { token: 'local_dev_bypass' },
			update: { used: false, expiresAt: new Date(Date.now() + 3600000) },
			create: {
				token: 'local_dev_bypass',
				expiresAt: new Date(Date.now() + 3600000),
			},
		});
		console.log('✅ Тестовый токен добавлен: local_dev_bypass');
		console.log('✅ Тестовые данные добавлены: AP1932');
	} catch (e) {
		console.error('❌ Ошибка сидинга:', e);
		process.exit(1);
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
