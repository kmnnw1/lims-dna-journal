import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

async function readPackageVersion() {
	const manifest = await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8');
	const pkg = JSON.parse(manifest);
	return pkg.version || '0.0.0';
}

export async function GET() {
	const version = await readPackageVersion();
	const otaUrl = process.env.OTA_RELEASE_URL;
	const response: Record<string, unknown> = {
		version,
		platform: 'lab-journal',
		otaEnabled: Boolean(otaUrl),
		importPath: process.env.DATA_XLSX_PATH || './data/data.xlsx',
	};

	if (otaUrl) {
		try {
			const remote = await fetch(otaUrl, { cache: 'no-store' });
			if (remote.ok) {
				const payload = await remote.json();
				response.remote = payload;
			} else {
				response.remoteError = `Failed to fetch OTA manifest (${remote.status})`;
			}
		} catch (error) {
			response.remoteError = `OTA fetch error: ${error instanceof Error ? error.message : String(error)}`;
		}
	}

	return NextResponse.json(response);
}
