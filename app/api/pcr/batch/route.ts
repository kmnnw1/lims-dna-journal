import { NextResponse } from 'next/server';
import { type ApiUser, handleError, requireRole } from '@/lib/api/helpers';
import { logAuditAction } from '@/lib/database/audit-log';
import { prisma } from '@/lib/database/prisma';
import {
	sanitizeString,
	validateContentType,
	validateSpecimenId,
} from '@/lib/security/input-validator';

export async function POST(request: Request) {
	try {
		const session = await requireRole('EDITOR');
		const user = session.user as ApiUser;

		const contentType = request.headers.get('content-type');
		if (!validateContentType(contentType)) {
			return NextResponse.json(
				{ error: 'Content-Type должен быть application/json' },
				{ status: 415 },
			);
		}

		const body = await request.json();
		const { ids, marker: rawMarker } = body;
		const marker = sanitizeString(rawMarker, 50);

		if (!Array.isArray(ids) || ids.length === 0) {
			return NextResponse.json(
				{ error: 'Необходимо указать массив ID образцов' },
				{ status: 400 },
			);
		}

		const validIds = ids
			.map((id) => validateSpecimenId(id))
			.filter((id): id is string => id !== null);

		if (validIds.length === 0) {
			return NextResponse.json({ error: 'Не найдено валидных ID образцов' }, { status: 400 });
		}

		if (!marker || typeof marker !== 'string') {
			return NextResponse.json({ error: 'Необходимо указать маркер' }, { status: 400 });
		}

		// Проверяем, что все specimen существуют
		const existingSpecimens = await prisma.specimen.findMany({
			where: { id: { in: validIds } },
			select: { id: true },
		});

		const existingIds = existingSpecimens.map((s: { id: string }) => s.id);
		const missingIds = validIds.filter((id) => !existingIds.includes(id));

		if (missingIds.length > 0) {
			return NextResponse.json(
				{
					error: `Образцы не найдены: ${missingIds.join(', ')}`,
				},
				{ status: 404 },
			);
		}

		// Создаём PcrAttempt для каждого specimen
		const pcrAttempts = validIds.map((specimenId) => ({
			specimenId,
			marker,
			result: 'PENDING', // Или другой статус по умолчанию
		}));

		const createdAttempts = await prisma.pcrAttempt.createMany({
			data: pcrAttempts,
		});

		// Логируем действие
		await logAuditAction({
			userId: user.id!,
			action: 'CREATE_PCR_ATTEMPT_BATCH',
			resourceType: 'PCR_ATTEMPT',
			details: {
				count: createdAttempts.count,
				marker,
				specimenIds: ids,
			},
		});

		return NextResponse.json({
			message: `Создано ${createdAttempts.count} попыток ПЦР`,
			count: createdAttempts.count,
		});
	} catch (e) {
		return handleError(e, request);
	}
}
