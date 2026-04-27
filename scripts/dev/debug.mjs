import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, '..', 'debug-output.txt');
let logs = [];

function log(msg) {
	console.log(msg);
	logs.push(msg);
}

async function main() {
	log('=== PRISMA & NEXT.JS DEBUGGER ===');
	log(`Node Version: ${process.version}`);
	log(`DATABASE_URL: ${process.env.DATABASE_URL}`);
	log(`CWD: ${process.cwd()}`);

	// Тест 1: Стандартный клиент
	try {
		log('\n[TEST 1] Стандартный PrismaClient (без адаптера)');
		const p1 = new PrismaClient();
		const count = await p1.specimen.count();
		log(`✓ Test 1 Успех. Проб в базе: ${count}`);
		await p1.$disconnect();
	} catch (e) {
		log('❌ Test 1 Ошибка: \n' + (e.stack || e.message));
	}

	// Тест 2: Клиент с принудительно вшитым URL
	try {
		log('\n[TEST 2] PrismaClient с явным URL');
		const p2 = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });
		const count = await p2.specimen.count();
		log(`✓ Test 2 Успех. Проб в базе: ${count}`);
		await p2.$disconnect();
	} catch (e) {
		log('❌ Test 2 Ошибка: \n' + (e.stack || e.message));
	}

	// Тест 3: Клиент через адаптер better-sqlite3
	try {
		log('\n[TEST 3] PrismaClient + better-sqlite3 адаптер');
		const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
		const sqlite = new Database(dbPath);
		const adapter = new PrismaBetterSqlite3(sqlite);
		const p3 = new PrismaClient({ adapter });
		const count = await p3.specimen.count();
		log(`✓ Test 3 Успех. Проб в базе: ${count}`);
		await p3.$disconnect();
	} catch (e) {
		log('❌ Test 3 Ошибка: \n' + (e.stack || e.message));
	}

	writeFileSync(logFile, logs.join('\n'));
	console.log(`\n✅ Готово! Дебаг-лог сохранен в корень проекта: debug-output.txt`);
}

main().catch(console.error);
