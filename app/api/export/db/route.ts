import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleError, requireRole } from '@/lib/api/helpers';

/**
 * API route to download the SQLite database file (.db)
 * Restricted to users with EDITOR or ADMIN role.
 */
export async function GET() {
	try {
		// Ensure user is authorized
		await requireRole('EDITOR');

		const dbPath = join(process.cwd(), 'prisma', 'dev.db');

		if (!existsSync(dbPath)) {
			throw { statusCode: 404, message: 'Файл базы данных не найден на сервере' };
		}

		// Read file contents
		const file = readFileSync(dbPath);

		// Return file as attachment
		return new Response(file, {
			headers: {
				'Content-Type': 'application/vnd.sqlite3',
				'Content-Disposition': 'attachment; filename="lab-journal.sqlite"',
				'Cache-Control': 'no-store', // Always get fresh DB
			},
		});
	} catch (e: unknown) {
		return handleError(e);
	}
}
