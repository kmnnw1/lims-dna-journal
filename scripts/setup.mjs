#!/usr/bin/env node
/**
 * Усовершенствованная подготовка проекта: Prisma 7, ExcelJS и тотальная табуляция.
 */

import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, title) {
	if (title) console.log(`\n→ ${title}\n`);
	try {
		execSync(cmd, { cwd: root, stdio: 'inherit', shell: true, env: process.env });
	} catch (err) {
		console.error(`❌ Ошибка выполнения '${cmd}':\n`, err?.message || err);
		process.exit(1);
	}
}

// Настройка npm
run('npm config set fund false', 'Конфигурация npm');

// Проверка версии Node.js
(function checkNodeVersion(required = 20) {
	const major = Number.parseInt(process.version.slice(1).split('.')[0] ?? '0', 10);
	if (major < required) {
		console.error(`❌ Требуется Node.js ${required}+. Обнаружено: ${process.version}`);
		process.exit(1);
	}
})();

const envPath = join(root, '.env');
const examplePath = join(root, '.env.example');

if (!existsSync(envPath)) {
	if (existsSync(examplePath)) {
		copyFileSync(examplePath, envPath);
		console.log('✅ Создан .env из .env.example');
	}
}

let envText = readFileSync(envPath, 'utf8');
let modified = false;

if (/^NEXTAUTH_SECRET=\s*$/m.test(envText) || /^NEXTAUTH_SECRET=$/m.test(envText)) {
	const secret = randomBytes(32).toString('base64');
	envText = envText.replace(/^NEXTAUTH_SECRET=.*$/m, `NEXTAUTH_SECRET="${secret}"`);
	modified = true;
}

if (modified) writeFileSync(envPath, envText);

// Prisma и зависимости
run('npx prisma generate', 'Генерация Prisma Client (v7)');
run('npx prisma db push', 'Синхронизация схемы БД');

// Форматирование кода (Табы и пустые строки)
try {
	run('npx prettier --write .', 'Причесываем код: переводим всё на табы');
} catch (e) {
	console.log('ℹ️ Prettier не смог отработать, проверьте конфиг.');
}

console.log('\n🟢 Готово! Проект на острие прогресса и на табах.\n👉 Запуск: npm run dev\n');
