import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Manual .env loading for standalone execution
function loadEnv() {
	const envPath = join(process.cwd(), '.env');
	if (existsSync(envPath)) {
		const envContent = readFileSync(envPath, 'utf8');
		for (const line of envContent.split('\n')) {
			const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
			if (match) {
				const [_, key, value] = match;
				if (key && value && !process.env[key]) {
					process.env[key] = value.replace(/(^['"]|['"]$)/g, '');
				}
			}
		}
	}
}

loadEnv();

const REPO = 'kmnnw1/lims-dna-journal';
const API_URL = `https://api.github.com/repos/${REPO}/actions/runs?per_page=10`;
const root = process.cwd();
const targetDir = join(root, '.internal_data');
const statusPath = join(targetDir, 'github_ci_status.md');

if (!existsSync(targetDir)) {
	mkdirSync(targetDir, { recursive: true });
}

async function fetchStatus() {
	console.log(`🌐 Fetching latest GitHub Actions runs for ${REPO}...`);

	const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

	try {
		const headers: Record<string, string> = {
			Accept: 'application/vnd.github.v3+json',
			'User-Agent': 'Antigravity-LIMS-Agent',
		};

		if (token) {
			headers['Authorization'] = `token ${token}`;
			console.log('🔑 Using GITHUB_TOKEN for authentication.');
		}

		const response = await fetch(API_URL, { headers });

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
		}

		const data = (await response.json()) as any;
		const runs = data.workflow_runs || [];

		let content = `## 🛰️ GitHub Actions Status\n\n`;

		if (runs.length === 0) {
			content += 'No recent workflow runs found.\n';
		} else {
			content += '| Workflow | Status | Conclusion | Started | Link |\n';
			content += '| :--- | :--- | :--- | :--- | :--- |\n';

			for (const run of runs) {
				const statusIcon =
					run.status === 'completed'
						? run.conclusion === 'success'
							? '✅'
							: '❌'
						: '⏳';

				const startedAt = new Date(run.run_started_at).toLocaleString();
				content += `| ${run.name} | ${statusIcon} ${run.status} | ${run.conclusion || 'pending'} | ${startedAt} | [View](${run.html_url}) |\n`;
			}
		}

		writeFileSync(statusPath, content);
		console.log(`🟢 GitHub status updated: ${statusPath}`);
	} catch (error: unknown) {
		const msg = (error as Error).message || String(error);
		console.error(`⚠️ Failed to fetch GitHub status: ${msg}`);
		writeFileSync(statusPath, `## 🛰️ GitHub Actions Status\n\n⚠️ Error: ${msg}\n`);
	}
}

fetchStatus();
