import type { AuditLog } from '@prisma/client';
import { NextResponse } from 'next/server';
import {
	type ApiUser,
	handleError,
	invalidateSpecimenCaches,
	requireRole,
} from '@/lib/api/helpers';
import { prisma } from '@/lib/db/prisma/prisma';
import { sanitizeString, validateContentType } from '@/lib/security/input-validator';

export async function GET(req: Request) {
	try {
		await requireRole('READER');
		const { searchParams } = new URL(req.url);
		const resourceId = sanitizeString(searchParams.get('resourceId'), 50);
		const resourceType = sanitizeString(searchParams.get('resourceType') || 'SPECIMEN', 50);

		if (!resourceId) {
			throw { statusCode: 400, message: 'resourceId обязателен' };
		}

		let whereClause: Record<string, unknown> = {
			resourceId,
			resourceType,
			changes: { not: null },
		};

		// Если мы смотрим историю пробы, нам нужны и логи её ПЦР-реакций
		if (resourceType === 'SPECIMEN') {
			whereClause = {
				OR: [
					{ resourceId, resourceType: 'SPECIMEN' },
					{
						resourceType: 'PCR_ATTEMPT',
						details: { contains: `"specimenId":"${resourceId}"` },
					},
					{
						resourceType: 'PCR_ATTEMPT',
						details: { contains: `"specimenId":"${resourceId}"` },
						action: { in: ['CREATE_PCR_ATTEMPT', 'DELETE_SPECIMEN'] },
					},
				],
			};
		}

		const history = await prisma.auditLog.findMany({
			// biome-ignore lint/suspicious/noExplicitAny: complex OR logic with nested conditions
			where: whereClause as any,
			orderBy: { timestamp: 'desc' },
			take: 100,
		});

		return NextResponse.json(
			history.map((item: AuditLog) => ({
				...item,
				details: item.details ? JSON.parse(item.details) : null,
				changes: item.changes ? JSON.parse(item.changes) : null,
			})),
		);
	} catch (e) {
		return handleError(e, req);
	}
}

export async function POST(req: Request) {
	try {
		const session = await requireRole('EDITOR');

		const contentType = req.headers.get('content-type');
		if (!validateContentType(contentType)) {
			throw { statusCode: 415, message: 'Content-Type должен быть application/json' };
		}

		const body = await req.json();
		const auditLogId = sanitizeString(body.auditLogId, 50);

		if (!auditLogId) {
			throw { statusCode: 400, message: 'auditLogId обязателен' };
		}

		const logEntry = await prisma.auditLog.findUnique({
			where: { id: auditLogId },
		});

		if (!logEntry || !logEntry.changes || !logEntry.resourceId) {
			throw {
				statusCode: 404,
				message: 'Запись лога не найдена или не содержит данных для отката',
			};
		}

		const changes = JSON.parse(logEntry.changes) as Record<string, { old?: unknown }>;
		const rollbackData: Record<string, unknown> = {};

		Object.entries(changes).forEach(([key, value]) => {
			rollbackData[key] = value.old;
		});

		rollbackData.deletedAt = null;

		if (logEntry.resourceType === 'SPECIMEN') {
			await prisma.specimen.update({
				where: { id: logEntry.resourceId },
				data: rollbackData,
			});
		} else if (logEntry.resourceType === 'PCR_ATTEMPT') {
			await prisma.pCRAttempt.update({
				where: { id: logEntry.resourceId },
				data: rollbackData,
			});
		}

		const currentUser = session.user as ApiUser | undefined;
		await prisma.auditLog.create({
			data: {
				userId: currentUser?.id || 'unknown',
				action: 'RESTORE_VERSION',
				resourceType: logEntry.resourceType,
				resourceId: logEntry.resourceId,
				details: JSON.stringify({ originalLogId: auditLogId }),
				changes: JSON.stringify(changes),
				timestamp: new Date(),
			},
		});

		invalidateSpecimenCaches();
		return NextResponse.json({ success: true });
	} catch (e) {
		return handleError(e, req);
	}
}
