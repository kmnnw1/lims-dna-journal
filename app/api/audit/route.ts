import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAuditLogs, getResourceAuditHistory } from '@/lib/database/audit-log';
import { prisma } from '@/lib/database/prisma';

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const resourceType = searchParams.get('resourceType');
		const resourceId = searchParams.get('resourceId');
		const limit = parseInt(searchParams.get('limit') || '100');

		let logs;

		if (resourceType && resourceId) {
			// История конкретного ресурса (доступна EDITOR и выше)
			logs = await getResourceAuditHistory(resourceType, resourceId, limit);
		} else {
			// Глобальный лог (только ADMIN)
			const user = session.user as { role?: string };
			if (user.role !== 'ADMIN') {
				return NextResponse.json(
					{ error: 'Недостаточно прав для просмотра глобального лога' },
					{ status: 403 },
				);
			}
			logs = await getAuditLogs({ limit });
		}

		return NextResponse.json(logs);
	} catch (e: unknown) {
		console.error('[Audit API Error]:', e);
		return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
	}
}
