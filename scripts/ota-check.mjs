#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'package.json');
const otaUrl = process.env.OTA_RELEASE_URL;

async function readCurrentVersion() {
	const raw = await fs.readFile(manifestPath, 'utf8');
	const pkg = JSON.parse(raw);
	return pkg.version || '0.0.0';
}

async function main() {
	const version = await readCurrentVersion();
	console.log(`Current installed version: ${version}`);
	if (!otaUrl) {
		console.log('No OTA_RELEASE_URL configured. Set it in your .env to enable remote update checks.');
		return;
	}

	console.log(`Checking remote OTA manifest at: ${otaUrl}`);
	try {
		const response = await fetch(otaUrl, { cache: 'no-store' });
		if (!response.ok) {
			console.error(`Failed to fetch OTA manifest: ${response.status}`);
			return;
		}
		const data = await response.json();
		console.log('Remote OTA manifest:');
		console.log(JSON.stringify(data, null, 2));
	} catch (error) {
		console.error('OTA check failed:', error?.message || error);
	}
}

main().catch((err) => {
	console.error('Unexpected error:', err);
	process.exit(1);
});
