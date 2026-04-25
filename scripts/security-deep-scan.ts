import fs from 'node:fs';
import path from 'node:path';

/**
 * Security Deep Scan Script
 * Выполняет тотальную проверку всех файлов проекта на наличие уязвимостей и инъекций.
 */

const FORBIDDEN_PATTERNS = [
	{ name: 'SQL Injection (Raw)', regex: /sql\.raw\(`.*?\$\{.*?\}|sql\(`.*?\$\{.*?\}/ },
	{ name: 'XSS (dangerouslySetInnerHTML)', regex: /dangerouslySetInnerHTML/ },
	{ name: 'Code Injection (eval)', regex: /eval\(|new Function\(|setTimeout\(["'].*?["']\)/ },
	{ name: 'Command Injection', regex: /child_process|execSync|spawnSync/ },
	{ name: 'Prompt Injection Risk', regex: /ignore previous instructions/i },
	{ name: 'Spaced Secret Bypass', regex: /[a-zA-Z] [a-zA-Z] [a-zA-Z] [a-zA-Z]/ },
];

const SECRET_PATTERNS = [
	{ name: 'Gemini API Key', regex: /AIzaSy[A-Za-z0-9_-]{33}/ },
	{ name: 'Generic Secret', regex: /secret["']?\s*[:=]\s*["'][a-zA-Z0-9]{20,}/i },
	{ name: 'GitHub Token', regex: /ghp_[a-zA-Z0-9]{36}/ },
];

const IGNORED_DIRS = [
	'node_modules',
	'.next',
	'.git',
	'playwright-report',
	'test-results',
	'local/agent/brain',
];
const IGNORED_FILES = [
	'scripts/security-deep-scan.ts',
	'package-lock.json',
	'dev.db',
	'TODO.md',
	'local/agent/thoughts.md',
];

function scanDir(dir: string) {
	const files = fs.readdirSync(dir);
	let violations = 0;

	for (const file of files) {
		const fullPath = path.join(dir, file);
		const relativePath = path.relative(process.cwd(), fullPath);

		if (IGNORED_DIRS.some((d) => relativePath.startsWith(d))) continue;
		if (IGNORED_FILES.includes(relativePath)) continue;

		const stats = fs.statSync(fullPath);
		if (stats.isDirectory()) {
			violations += scanDir(fullPath);
		} else {
			// Проверяем только текстовые файлы
			if (/\.(ts|tsx|js|jsx|json|md|env|txt|css|html|php)$/.test(file)) {
				const content = fs.readFileSync(fullPath, 'utf8');
				const normalizedPath = relativePath.split(path.sep).join('/');

				// Проверка на запрещенные паттерны
				for (const pattern of FORBIDDEN_PATTERNS) {
					// Исключения для определенных директорий/файлов
					if (
						pattern.name === 'Command Injection' &&
						(normalizedPath.startsWith('scripts') ||
							normalizedPath.startsWith('.internal_data'))
					)
						continue;
					if (
						pattern.name === 'Prompt Injection Risk' &&
						normalizedPath === 'lib/excel/ai-parser.ts' &&
						content.includes('CRITICAL SECURITY RULES')
					)
						continue;
					if (normalizedPath === 'scripts/security-deep-scan.ts') continue;

					if (pattern.regex.test(content)) {
						console.error(
							`❌ [VULNERABILITY] Found ${pattern.name} in ${normalizedPath}`,
						);
						violations++;
					}
				}

				// Проверка на секреты
				for (const pattern of SECRET_PATTERNS) {
					if (pattern.regex.test(content)) {
						console.warn(
							`⚠️ [SECRET] Potential ${pattern.name} found in ${relativePath}`,
						);
						violations++;
					}
				}
			}
		}
	}
	return violations;
}

console.log('🚀 Starting Security Deep Scan...');
const totalViolations = scanDir(process.cwd());

if (totalViolations === 0) {
	console.log('\n✨ ALL CLEAR! No security violations found.');
} else {
	console.log(`\n🚨 FOUND ${totalViolations} potential security issues. Please review them!`);
	process.exit(1);
}
