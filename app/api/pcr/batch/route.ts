import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logAuditAction } from '@/lib/database/audit-log';

type ApiUser = { id?: string; role?: string };

// Вспомогательный хелпер для проверки авторизации и роли
async function requireRole(required: 'EDITOR' | 'ADMIN' | 'READER' | 'ANY' = 'ANY') {
	const session = await getServerSession(authOptions);
	if (!session) throw { statusCode: 401, message: 'Требуется вход в систему' };
	const user = session.user as ApiUser | undefined;
	const role = user?.role;
	if (!role) throw { statusCode: 403, message: 'Роль пользователя не определена' };
	if (required === 'ADMIN' && role !== 'ADMIN')
		throw { statusCode: 403, message: 'Доступ запрещён (требуется ADMIN)' };
	if (required === 'EDITOR' && !['ADMIN', 'EDITOR'].includes(role))
		throw { statusCode: 403, message: 'Доступ запрещён (требуется EDITOR)' };
	if (required === 'READER' && !['ADMIN', 'EDITOR', 'READER'].includes(role))
		throw { statusCode: 403, message: 'Доступ запрещён (требуется READER)' };
	return session;
}

// Универсальный обработчик ошибок для API
function handleError(e: unknown) {
	console.error('[API Error]:', e); // Логируем реальную причину падения в терминал
	if (e && typeof e === 'object' && 'statusCode' in e) {
		const error = e as { statusCode: number; message: string };
		return NextResponse.json({ error: error.message }, { status: error.statusCode });
	}
	return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
}

export async function POST(request: Request) {
	try {
		const session = await requireRole('EDITOR'); // Требуется EDITOR или выше
		const user = session.user as ApiUser;
		const { ids, marker } = await request.json();

		if (!Array.isArray(ids) || ids.length === 0) {
			return NextResponse.json({ error: 'Необходимо указать массив ID образцов' }, { status: 400 });
		}

		if (!marker || typeof marker !== 'string') {
			return NextResponse.json({ error: 'Необходимо указать маркер' }, { status: 400 });
		}

		// Проверяем, что все specimen существуют
		const existingSpecimens = await prisma.specimen.findMany({
			where: { id: { in: ids } },
			select: { id: true }
		});

		const existingIds = existingSpecimens.map(s => s.id);
		const missingIds = ids.filter(id => !existingIds.includes(id));

		if (missingIds.length > 0) {
			return NextResponse.json({
				error: `Образцы не найдены: ${missingIds.join(', ')}`
			}, { status: 404 });
		}

		// Создаём PcrAttempt для каждого specimen
		const pcrAttempts = ids.map(specimenId => ({
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
			count: createdAttempts.count
		});

	} catch (e) {
		return handleError(e);
	}
}