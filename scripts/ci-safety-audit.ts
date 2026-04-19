import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * CI SAFETY AUDIT (Умный аудит CI)
 * Этот скрипт скачивает полные логи последних запусков GitHub Actions
 * и проводит глубокий поиск «восклицательных знаков» и предупреждений.
 */

// Загрузка .env
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
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const headers: Record<string, string> = {
	Accept: 'application/vnd.github.v3+json',
	'User-Agent': 'Antigravity-LIMS-Auditor',
};

if (token) {
	headers['Authorization'] = `token ${token}`;
} else {
	console.error('❌ GITHUB_TOKEN not found in .env. Authentication failed.');
	process.exit(1);
}

interface WorkflowRun {
	id: number;
	name: string;
	status: string;
	conclusion: string | null;
	jobs_url: string;
	html_url: string;
	display_title: string;
}

const NOISE_KEYWORDS = [
	'npm fund',
	'npm audit fix',
	'Recommended protections disabled',
	'ExperimentalWarning',
	'Checked 130 files', // Biome noise
	'No fixes applied',
];

const DEBT_KEYWORDS = ['npm warn deprecated', 'no longer supported', 'no longer maintained'];

interface Job {
	id: number;
	name: string;
	status: string;
	conclusion: string | null;
}

async function runAudit() {
	console.log('🕵️‍♂️ Starting CI Safety Audit (Principle of Transparency)...');

	try {
		const response = await fetch(
			`https://api.github.com/repos/${REPO}/actions/runs?per_page=5`,
			{ headers },
		);
		if (!response.ok) throw new Error(`API error: ${response.status}`);
		const data = (await response.json()) as { workflow_runs: WorkflowRun[] };

		for (const run of data.workflow_runs) {
			console.log('\n────────────────────────────────────────────────────────────');
			console.log(`📡 Run: [${run.name}] "${run.display_title}"`);
			console.log(`📊 Status: ${run.status} | Conclusion: ${run.conclusion || 'Ongoing'}`);
			console.log(`🔗 Link: ${run.html_url}`);

			const jobsResp = await fetch(run.jobs_url, { headers });
			const jobsData = (await jobsResp.json()) as { jobs: Job[] };

			for (const job of jobsData.jobs) {
				console.log(`  📦 Job: ${job.name} (${job.conclusion || job.status})`);

				if (job.status !== 'completed' && job.status !== 'in_progress') continue;

				const logsResp = await fetch(
					`https://api.github.com/repos/${REPO}/actions/jobs/${job.id}/logs`,
					{ headers },
				);
				if (!logsResp.ok) {
					console.log(`    ⚠️ Could not fetch logs for ${job.name}`);
					continue;
				}

				const logs = await logsResp.text();
				const lines = logs.split('\n');

				const alerts = lines.filter((line) => {
					const l = line.toLowerCase();
					const hasWarn = l.includes('!') || l.includes('error') || l.includes('fail');
					const isNoise = NOISE_KEYWORDS.some((k) => l.includes(k.toLowerCase()));
					return hasWarn && !isNoise;
				});

				const debt = lines.filter((line) => {
					const l = line.toLowerCase();
					return DEBT_KEYWORDS.some((k) => l.includes(k.toLowerCase()));
				});

				if (alerts.length > 0) {
					console.log(`    🚨 CRITICAL ALERTS (${alerts.length}):`);
					alerts.slice(-10).forEach((line) => {
						const cleanLine = line
							.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s+/, '')
							.trim();
						if (cleanLine) console.log(`      ❌ ${cleanLine}`);
					});
				}

				if (debt.length > 0) {
					console.log(`    🛠️  MODERNIZATION DEBT (${debt.length}):`);
					debt.slice(-5).forEach((line) => {
						const cleanLine = line
							.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s+/, '')
							.trim();
						if (cleanLine) console.log(`      📜 ${cleanLine}`);
					});
					if (debt.length > 5)
						console.log(`      ... and ${debt.length - 5} more items.`);
				}

				if (alerts.length === 0 && debt.length === 0) {
					console.log(`    ✅ Logs are clean (No hidden issues detected).`);
				}
			}
		}

		console.log(`\n✨ Audit complete. All recent CI runs inspected.`);
	} catch (e) {
		console.error('❌ Audit failed:', e);
	}
}

runAudit();
