#!/usr/bin/env node
/**
 * Быстрая автоматизация: установка, подготовка и запуск проекта одной командой.
 * После git clone (Node.js 20+):
 *     node scripts/install-all.mjs
 * Шаги: npm install → скрипт setup (Prisma, build) → npm start
 */

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, stage) {
	try {
		if (stage) {
			console.log(`\n→ ${stage}\n`);
		}
		execSync(cmd, { cwd: root, stdio: 'inherit', shell: true, env: process.env });
	} catch (error) {
		console.error(`\n❌ Ошибка на этапе "${stage || cmd}":\n`, error?.message || error);
		process.exit(1);
	}
}

function requireNodeVersion(majorRequired = 20) {
	const current = Number.parseInt(process.version.slice(1).split('.')[0] || '0', 10);
	if (current < majorRequired) {
		console.error(`❌ Требуется Node.js ${majorRequired}+, установлено: ${process.version}`);
		process.exit(1);
	}
}

requireNodeVersion();

run('npm install', 'npm install');
run('node scripts/setup.mjs', 'setup (Prisma + build)');
run('npm start', 'npm start (Ctrl+C для остановки)');
