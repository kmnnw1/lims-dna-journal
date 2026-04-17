import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import {
	type ApiUser,
	handleError,
	invalidateSpecimenCaches,
	requireRole,
} from '../specimens/helpers';

export async function GET(req: Request) {
	try {
		await requireRole('READER');
		const { searchParams } = new URL(req.url);
		const resourceId = searchParams.get('resourceId');
		const resourceType = searchParams.get('resourceType') || 'SPECIMEN';

		if (!resourceId) {
			return NextResponse.json({ error: 'resourceId обязателен' }, { status: 400 });
		}

		let whereClause: any = {
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
					// Также включаем случаи создания и удаления, где изменений может и не быть в поле 'changes',
					// но они критичны для понимания истории
					{
						resourceType: 'PCR_ATTEMPT',
						details: { contains: `"specimenId":"${resourceId}"` },
						action: { in: ['CREATE_PCR_ATTEMPT', 'DELETE_SPECIMEN'] },
					},
				],
			};
		}

		const history = await prisma.auditLog.findMany({
			where: whereClause,
			orderBy: { timestamp: 'desc' },
			take: 100, // Увеличим лимит для объединеного вида
		});

		return NextResponse.json(
			history.map((item: any) => ({
				...item,
				details: item.details ? JSON.parse(item.details) : null,
				changes: item.changes ? JSON.parse(item.changes) : null,
			})),
		);
	} catch (e) {
		return handleError(e);
	}
}

export async function POST(req: Request) {
	try {
		const session = await requireRole('EDITOR');
		const body = await req.json();
		const { auditLogId } = body;

		if (!auditLogId) {
			return NextResponse.json({ error: 'auditLogId обязателен' }, { status: 400 });
		}

		const logEntry = await prisma.auditLog.findUnique({
			where: { id: auditLogId },
		});

		if (!logEntry || !logEntry.changes || !logEntry.resourceId) {
			return NextResponse.json(
				{ error: 'Запись лога не найдена или не содержит данных для отката' },
				{ status: 404 },
			);
		}

		const changes = JSON.parse(logEntry.changes);
		const rollbackData: Record<string, any> = {};

		// Для отката мы берем 'old' значения из этой записи лога
		// Это вернет ресурс в состояние ДО этой операции
		Object.keys(changes).forEach((key) => {
			rollbackData[key] = changes[key].old;
		});

		// Если это был DELETE (мягкое удаление), откат восстановит запись
		rollbackData.deletedAt = null;

		if (logEntry.resourceType === 'SPECIMEN') {
			await prisma.specimen.update({
				where: { id: logEntry.resourceId },
				data: rollbackData,
			});
		} else if (logEntry.resourceType === 'PCR_ATTEMPT') {
			await prisma.pcrAttempt.update({
				where: { id: logEntry.resourceId },
				data: rollbackData,
			});
		}

		// Логируем сам факт отката
		const currentUser = session.user as ApiUser | undefined;
		await prisma.auditLog.create({
			data: {
				userId: currentUser?.id || 'unknown',
				action: 'RESTORE_VERSION',
				resourceType: logEntry.resourceType,
				resourceId: logEntry.resourceId,
				details: JSON.stringify({ originalLogId: auditLogId }),
				changes: JSON.stringify(changes), // Сохраняем что именно мы откатили
				timestamp: new Date(),
			},
		});

		invalidateSpecimenCaches();
		return NextResponse.json({ success: true });
	} catch (e) {
		return handleError(e);
	}
}
