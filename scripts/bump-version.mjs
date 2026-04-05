import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = join(root, 'package.json');

function getDiffStat() {
	try {
		const stat = execSync('git diff --cached --shortstat', { encoding: 'utf8' }).trim();
		if (!stat) return { files: 0, lines: 0 };
		
		const files = parseInt(stat.match(/(\d+)\s+file/)?.[1] || '0', 10);
		const insertions = parseInt(stat.match(/(\d+)\s+insertion/)?.[1] || '0', 10);
		const deletions = parseInt(stat.match(/(\d+)\s+deletion/)?.[1] || '0', 10);
		
		return { files, lines: insertions + deletions };
	} catch {
		return { files: 0, lines: 0 };
	}
}

const { files, lines } = getDiffStat();
if (lines === 0 && files === 0) {
	console.log('[SYSTEM] Изменений в отслеживаемых файлах не обнаружено.');
	process.exit(0);
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
let [major, minor, patch, build] = pkg.version.split('.').map(Number);

// Умная логика: защищаем Major и Minor от случайных бампов
if (lines > 5000) {
	// Аномальный объем (например, Prettier пробежался или обновился package-lock)
	// Это НЕ эпическая фича, это просто форматирование. Бампаем только Build.
	build++;
	console.log(`[SYSTEM] Автоматическое форматирование или лок-файл (${files} файлов, ${lines} строк). Инкремент: Build.`);
} else if (files >= 5 || lines > 300) {
	// Затронуто много файлов или логики — это полноценная фича (Patch)
	patch++;
	build = 0;
	console.log(`[SYSTEM] Интеграция функционала (${files} файлов, ${lines} строк). Инкремент: Patch.`);
} else {
	// 1-4 файла — это локальный фикс или рутина (Build)
	build++;
	console.log(`[SYSTEM] Локальные правки (${files} файлов, ${lines} строк). Инкремент: Build.`);
}

pkg.version = [major, minor, patch, build].join('.');
writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
console.log(`[SYSTEM] Версия проекта: ${pkg.version}`);

try {
	execSync('git add package.json', { cwd: root });
} catch (e) {
	console.warn('[ERROR] Не удалось выполнить индексацию файла package.json');
}
