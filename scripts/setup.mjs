#!/usr/bin/env node
/**
 * Усовершенствованная подготовка проекта: Prisma 7, автоматизация версий и Husky.
 */

import {execSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync, copyFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, title) {
	if (title) console.log(`\n→ ${title}\n`);
	try {
		execSync(cmd, {cwd: root, stdio: 'inherit', shell: true, env: process.env});
	} catch (err) {
		console.error(`❌ Ошибка выполнения '${cmd}':\n`, err?.message || err);
		process.exit(1);
	}
}

run('npm config set fund false', 'Настройка npm');

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

// Prisma и автоматизация
run('npm install', 'Установка всех зависимостей');
run('npx prisma generate', 'Генерация Prisma 7 Client');
run('npx prisma db push', 'Синхронизация схемы БД');
run('npx husky', 'Инициализация Git Hooks (Husky)');

// Форматирование
try {
	run('npx prettier --write .', 'Причесываем код перед стартом');
} catch (e) {
	console.log('ℹ️ Проблемы с форматированием, пропускаем.');
}

console.log('\n🟢 Готово! Версионирование автоматизировано.\n👉 Запуск: npm run dev\n');
