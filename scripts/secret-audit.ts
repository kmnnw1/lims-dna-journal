import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Secret Audit Script (Rule 16)
 * Проверяет измененные файлы на наличие секретов и небезопасных строк.
 */

const SECRET_PATTERNS = [
	{ name: 'Gemini API Key', regex: /AIzaSy[A-Za-z0-9_-]{33}/ },
	{ name: 'OpenAI API Key', regex: /sk-[A-Za-z0-9]{32,}/ },
	{ name: 'Database URL', regex: /postgresql:\/\/.*:.*@/ },
	{ name: 'Prisma Secret', regex: /DATABASE_URL=.*:.*@/ },
	{ name: 'Private Key', regex: /-----BEGIN (RSA|EC|PGP) PRIVATE KEY-----/ },
	{ name: 'Default Admin', regex: /admin:admin|admin\/admin/i },
	{ name: 'Hardcoded Token', regex: /test-token-123|123456/ },
];

function audit() {
	console.log('🔍 Running Secret Audit...');

	try {
		// Получаем список файлов в стейдже (Git)
		const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
			.split('\n')
			.filter(Boolean);

		if (stagedFiles.length === 0) {
			console.log('✅ No staged files to audit.');
			return;
		}

		let foundSecrets = false;

		for (const file of stagedFiles) {
			if (!fs.existsSync(file) || fs.lstatSync(file).isDirectory()) continue;

			// Игнорируем бинарные файлы и сам скрипт аудита
			if (
				file.endsWith('.png') ||
				file.endsWith('.jpg') ||
				file.endsWith('.ico') ||
				file === 'scripts/secret-audit.ts'
			)
				continue;

			const content = fs.readFileSync(file, 'utf8');

			for (const pattern of SECRET_PATTERNS) {
				if (pattern.regex.test(content)) {
					console.error(
						`❌ CRITICAL: Potential secret found in ${file}: ${pattern.name}`,
					);
					foundSecrets = true;
				}
			}
		}

		if (foundSecrets) {
			console.error('🚫 Commit blocked due to potential secret leakage (Rule 16).');
			process.exit(1);
		}

		console.log('✅ Secret audit passed.');
	} catch (_error) {
		console.warn('⚠️ Could not run full audit (Git not available or other error).');
	}
}

audit();
