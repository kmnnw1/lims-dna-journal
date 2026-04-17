import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Профессиональный скрипт версионирования (SemVer 2.0).
 * Логика:
 * - Build: Технические правки, рефакторинг, фиксы.
 * - Patch: Новые UI-элементы, небольшие фичи.
 * - Minor: Крупные инфраструктурные изменения или новые модули.
 */

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
	console.log('[SYSTEM] Изменений в отслеживаемых файлах не обнаружено. Пропуск бампа.');
	process.exit(0);
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
let [major, minor, patch, build] = pkg.version.split('.').map(Number);
const initialVersion = pkg.version;

// Определение типа инкремента (Heuristic 2026)
if (lines > 1000 && files > 10) {
	// Масштабная модернизация (Minor)
	minor++;
	patch = 0;
	build = 0;
	console.log(`[SYSTEM] Пакетная модернизация (${files} ф. / ${lines} стр.). Инкремент: Minor.`);
} else if (files >= 3 || lines > 150) {
	// Полноценная фича или фикс логики (Patch)
	patch++;
	build = 0;
	console.log(`[SYSTEM] Функциональное изменение (${files} ф. / ${lines} стр.). Инкремент: Patch.`);
} else {
	// Точечные правки (Build)
	build++;
	console.log(`[SYSTEM] Техническая правка (${files} ф. / ${lines} стр.). Инкремент: Build.`);
}

pkg.version = [major, minor, patch, build].join('.');
writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
console.log(`[SYSTEM] Версия обновлена: ${initialVersion} -> ${pkg.version}`);

try {
	execSync('git add package.json', { cwd: root });
} catch (e) {
	console.warn('[ERROR] Не удалось проиндексировать package.json');
}
