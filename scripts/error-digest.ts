import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const targetDir = join(root, '.internal_data');
const digestPath = join(targetDir, 'error_digest.md');

if (!existsSync(targetDir)) {
	mkdirSync(targetDir, { recursive: true });
}

function runCheck(name: string, cmd: string): string {
	try {
		execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
		return `### ✅ ${name}\nNo errors found.\n`;
	} catch (error: unknown) {
		const err = error as { stdout?: string; stderr?: string; message?: string };
		const output = err.stdout || err.stderr || err.message;
		return `### ❌ ${name}\n\`\`\`text\n${output}\n\`\`\`\n`;
	}
}

async function generateDigest() {
	console.log('📝 Generating error digest...');

	let content = `# Project Error Digest 🕵️‍♂️\n`;
	content += `Last Update: ${new Date().toLocaleString()}\n\n`;

	content += runCheck('Biome Lint', 'npm run lint --silent');
	content += runCheck('TypeScript Check', 'npm run check --silent');
	content += runCheck('Unit Tests', 'npm test -- --run --silent');

	// Inject GitHub Status if available
	content += '\n---\n\n';
	const githubStatusPath = join(targetDir, 'github_ci_status.md');
	if (existsSync(githubStatusPath)) {
		content += readFileSync(githubStatusPath, 'utf8');
	} else {
		content += '### 🛰️ GitHub Actions Status\nSyncing...\n';
	}

	writeFileSync(digestPath, content);
	console.log(`🟢 Digest updated: ${digestPath}`);
}

generateDigest();
