import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { handleError, requireRole } from '@/lib/api/helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
	try {
		await requireRole('ADMIN');

		const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

		if (!fs.existsSync(dbPath)) {
			throw { statusCode: 404, message: 'Файл базы данных не найден' };
		}

		const fileBuffer = fs.readFileSync(dbPath);

		return new NextResponse(fileBuffer, {
			status: 200,
			headers: {
				'Content-Disposition': `attachment; filename="lims_backup_${new Date().toISOString().split('T')[0]}.db"`,
				'Content-Type': 'application/vnd.sqlite3',
				'Cache-Control': 'no-store',
			},
		});
	} catch (e: unknown) {
		return handleError(e, req);
	}
}
