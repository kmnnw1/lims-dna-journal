import { NextResponse } from 'next/server';
import { handleError, requireRole } from '@/lib/api/helpers';
import { getAuditLogs, getResourceAuditHistory } from '@/lib/database/audit-log';
import { sanitizeString, validatePagination } from '@/lib/security/input-validator';

export async function GET(req: Request) {
	try {
		const session = await requireRole('READER');
		const { searchParams } = new URL(req.url);

		const resourceType = sanitizeString(searchParams.get('resourceType'), 50);
		const resourceId = sanitizeString(searchParams.get('resourceId'), 50);
		const { limit } = validatePagination(null, searchParams.get('limit'));

		let logs;

		if (resourceType && resourceId) {
			// История конкретного ресурса (доступна READER и выше)
			logs = await getResourceAuditHistory(resourceType, resourceId, limit);
		} else {
			// Глобальный лог (только ADMIN)
			const user = session.user as { role?: string };
			if (user.role !== 'ADMIN') {
				throw {
					statusCode: 403,
					message: 'Недостаточно прав для просмотра глобального лога',
				};
			}
			logs = await getAuditLogs({ limit });
		}

		return NextResponse.json(logs);
	} catch (e: unknown) {
		return handleError(e, req);
	}
}
