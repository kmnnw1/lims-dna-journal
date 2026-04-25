import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
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

function getDiffFiles(): string[] {
	try {
		const isCI = process.env.GITHUB_ACTIONS === 'true';
		const diffBase = isCI ? 'HEAD^..HEAD' : '--cached';
		const stdout = execSync(`git diff ${diffBase} --name-only`, { encoding: 'utf8' }).trim();
		return stdout.split('\n').filter(Boolean);
	} catch {
		return [];
	}
}

function getHeadVersion(): string | null {
	try {
		const stdout = execSync('git show HEAD:package.json', {
			encoding: 'utf8',
			stdio: ['pipe', 'pipe', 'ignore'],
		}).trim();
		const pkg = JSON.parse(stdout);
		return pkg.version;
	} catch {
		return null;
	}
}

const changedFiles = getDiffFiles();
if (changedFiles.length === 0) {
	console.log('[SYSTEM] Изменений в отслеживаемых файлах не обнаружено. Пропуск бампа.');
	process.exit(0);
}

// Семантические паттерны
const isDatabase = (f: string) =>
	f.includes('prisma/schema.prisma') || f.includes('prisma/migrations');
const isLogic = (f: string) => (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.includes('tests/');
const isMeta = (f: string) =>
	f.endsWith('.css') ||
	f.includes('.github/') ||
	f.includes('.husky/') ||
	f.includes('tests/') ||
	f.endsWith('.md') ||
	f.endsWith('.json');

const hasDB = changedFiles.some(isDatabase);
const hasLogic = changedFiles.some(isLogic);
const _hasMeta = changedFiles.some(isMeta);

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const currentVersion = pkg.version;
const headVersion = getHeadVersion();

// Если версия в файле уже больше, чем в HEAD, значит мы уже бампнули её в этой сессии коммита
// (например, при повторной попытке после ошибки линтера)
if (headVersion && currentVersion !== headVersion) {
	const [cMajor, cMinor, cPatch, cBuild] = currentVersion.split('.').map(Number);
	const [hMajor, hMinor, hPatch, hBuild] = headVersion.split('.').map(Number);

	const isAlreadyBumped =
		cMajor > hMajor ||
		(cMajor === hMajor && cMinor > hMinor) ||
		(cMajor === hMajor && cMinor === hMinor && cPatch > hPatch) ||
		(cMajor === hMajor && cMinor === hMinor && cPatch === hPatch && cBuild > hBuild);

	if (isAlreadyBumped) {
		console.log(
			`[SYSTEM] Версия уже была обновлена (${headVersion} -> ${currentVersion}). Пропуск повторного бампа.`,
		);
		process.exit(0);
	}
}

let [major, minor, patch, build] = currentVersion.split('.').map(Number);

// Определение типа инкремента (Semantic Heuristic 2026)
if (hasDB) {
	// Структурные изменения БД (Minor)
	minor++;
	patch = 0;
	build = 0;
	console.log(
		`[SYSTEM] Изменение схемы базы данных (${changedFiles.length} ф.). Инкремент: Minor.`,
	);
} else if (hasLogic) {
	// Новые UI-элементы или логика (Patch)
	patch++;
	build = 0;
	console.log(
		`[SYSTEM] Изменение программной логики/UI (${changedFiles.length} ф.). Инкремент: Patch.`,
	);
} else {
	// Технические правки, тесты, мета-данные или инфраструктура (Build)
	build++;
	console.log(
		`[SYSTEM] Техническая правка/Тесты/Мета (${changedFiles.length} ф.). Инкремент: Build.`,
	);
}

pkg.version = [major, minor, patch, build].join('.');
writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
console.log(`[SYSTEM] Версия обновлена: ${currentVersion} -> ${pkg.version}`);

try {
	execSync('git add package.json', { cwd: root });
} catch (_e) {
	console.warn('[ERROR] Не удалось проиндексировать package.json');
}
