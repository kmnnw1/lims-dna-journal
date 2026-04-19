import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const targetDir = join(root, '.internal_data');
const logsDir = join(targetDir, 'logs');
const digestPath = join(targetDir, 'error_digest.md');

// Ensure directories exist
[targetDir, logsDir].forEach((dir) => {
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
});

/**
 * Очищает вывод от ANSI-кодов и повторяющегося шума
 */
function smartFilter(text: string): string {
	// 1. Убираем ANSI escape-последовательности (цвета и т.д.)
	const cleanAnsi = text.replace(
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
		'',
	);

	// 2. Убираем повторяющийся шум Biome и TSC
	const lines = cleanAnsi.split('\n');
	const usefulLines = lines.filter((line) => {
		const noise = [
			'Checked 127 files',
			'No fixes applied',
			'Some errors were emitted',
			'npx tsc --noEmit',
			'biome check .',
			'npm run lint',
		];
		return !noise.some((n) => line.includes(n)) && line.trim().length > 0;
	});

	return usefulLines.join('\n');
}

function runCheck(name: string, cmd: string, filename: string): string {
	const logPath = join(logsDir, filename);
	let output = '';
	let isError = false;

	try {
		output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
	} catch (error: unknown) {
		isError = true;
		const err = error as { stdout?: string; stderr?: string; message?: string };
		output = err.stdout || err.stderr || err.message || 'Unknown error';
	}

	// Всегда сохраняем полный лог
	writeFileSync(logPath, output);

	const summary = smartFilter(output);
	const statusIcon = isError ? '❌' : '✅';
	const statusText = isError ? 'Errors detected' : 'No errors found';

	let section = `### ${statusIcon} ${name}\n`;
	section += `Status: **${statusText}** | [Full Log](file:///${logPath.replace(/\\/g, '/')})\n\n`;

	if (isError || summary.length > 0) {
		section += `#### Highlights:\n\`\`\`text\n${summary.slice(0, 2000)}${summary.length > 2000 ? '\n... truncated ...' : ''}\n\`\`\`\n`;
	}

	return section;
}

async function generateDigest() {
	console.log('📝 Generating advanced diagnostic digest...');

	let content = `# Project Diagnostic Digest 🕵️‍♂️\n`;
	content += `Generated: ${new Date().toLocaleString()}\n\n`;
	content += `> [!NOTE]\n> Full logs are archived in \`.internal_data/logs/\` for deep analysis.\n\n`;

	content += runCheck('Biome Lint', 'npm run lint --silent', 'lint.log');
	content += runCheck('TypeScript Check', 'npm run check --silent', 'tsc.log');
	content += runCheck('Unit Tests', 'npm test -- --run --silent', 'test.log');

	// Inject GitHub Status if available
	content += '\n---\n\n';
	const githubStatusPath = join(targetDir, 'github_ci_status.md');
	if (existsSync(githubStatusPath)) {
		content += readFileSync(githubStatusPath, 'utf8');
	} else {
		content += '### 🛰️ GitHub Actions Status\nSyncing...\n';
	}

	writeFileSync(digestPath, content);
	console.log(`🟢 Diagnostic Digest updated: ${digestPath}`);
}

generateDigest();
