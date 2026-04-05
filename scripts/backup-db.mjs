/**
 * Скрипт резервного копирования SQLite dev.db в backups/dev-<timestamp>.db
 * Usage: node scripts/backup-db.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';
import {existsSync} from 'fs';

async function main() {
	try {
		const __dirname = path.dirname(fileURLToPath(import.meta.url));
		const root = path.join(__dirname, '..');
		const db = path.join(root, 'prisma', 'dev.db');
		const dir = path.join(root, 'backups');

		if (!existsSync(db)) {
			console.error(`❌ Database file not found: ${db}`);
			process.exit(1);
		}

		try {
			await fs.mkdir(dir, {recursive: true});
		} catch (err) {
			console.error(`❌ Failed to create backup directory: ${dir}\n`, err);
			process.exit(1);
		}

		const now = new Date();
		// Строка с датой и временем для имени файла, формат YYYYMMDD-HHMMSS
		const ts = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
		const dest = path.join(dir, `dev-${ts}.db`);

		await fs.copyFile(db, dest);
		console.log(`✅ Backup created: ${dest}`);
	} catch (err) {
		console.error('⚠️ Backup failed:', err);
		process.exit(1);
	}
}

main();
