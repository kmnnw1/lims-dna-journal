import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Manual .env loading
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
	'User-Agent': 'Antigravity-LIMS-Agent',
};

if (token) {
	headers['Authorization'] = `token ${token}`;
}

async function fetchLogs() {
	console.log(`🔍 Searching for latest Playwright failures in ${REPO}...`);

	try {
		// 1. Get latest runs
		const runsResponse = await fetch(
			`https://api.github.com/repos/${REPO}/actions/runs?per_page=10`,
			{ headers },
		);
		if (!runsResponse.ok) throw new Error(`API error: ${runsResponse.status}`);
		const runsData = (await runsResponse.json()) as any;

		// 2. Find latest COMPLETED FAILED "Playwright Tests" run
		const pwRun = runsData.workflow_runs.find(
			(r: any) => r.name === 'Playwright Tests' && r.conclusion === 'failure' && r.status === 'completed'
		);

		if (!pwRun) {
			console.log('❌ No Playwright runs found.');
			return;
		}

		console.log(`✅ Found run ${pwRun.id} (${pwRun.status}, ${pwRun.conclusion})`);

		// 3. Get jobs for this run
		const jobsResponse = await fetch(pwRun.jobs_url, { headers });
		if (!jobsResponse.ok) throw new Error('Failed to fetch jobs');
		const jobsData = (await jobsResponse.json()) as any;

		for (const job of jobsData.jobs) {
			console.log(`📦 Job: ${job.name} (Status: ${job.conclusion})`);

			if (job.conclusion === 'failure' || job.status === 'in_progress') {
				console.log(`📥 Fetching logs for job ${job.id}...`);
				const logsResponse = await fetch(
					`https://api.github.com/repos/${REPO}/actions/jobs/${job.id}/logs`,
					{ headers },
				);

				if (logsResponse.ok) {
					const logs = await logsResponse.text();
					const logPath = join(process.cwd(), '.internal_data', `playwright_${job.id}.log`);
					writeFileSync(logPath, logs);
					console.log(`💾 Logs saved to ${logPath}`);

					// Extract failures for quick summary
					const lines = logs.split('\n');
					const failures = lines.filter((l) =>
						l.toLowerCase().includes('failed') ||
						l.toLowerCase().includes('error') ||
						l.toLowerCase().includes('failure')
					).slice(-30);

					console.log('\n--- LAST 30 FAILURE LINES ---');
					console.log(failures.join('\n'));
					console.log('-----------------------------\n');
				}
			}
		}
	} catch (error: unknown) {
		console.error('⚠️ Error fetching logs:', error);
	}
}

fetchLogs();
