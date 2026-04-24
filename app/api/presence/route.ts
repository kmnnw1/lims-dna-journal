import { NextResponse } from 'next/server';
import { type ApiUser, handleError, requireRole } from '@/lib/api/helpers';
import { prisma } from '@/lib/database/prisma';
import { sanitizeString } from '@/lib/security/input-validator';

/**
 * API для отслеживания присутствия пользователей (Heartbeat).
 * GET: Получить список активных пользователей за последние 60 секунд.
 * POST: Обновить свой статус (Heartbeat).
 */

export async function GET(req: Request) {
	try {
		await requireRole('READER');

		const now = new Date();
		const activeThreshold = new Date(now.getTime() - 60 * 1000); // Активные за последние 60 сек

		const activeActivities = await prisma.userActivity.findMany({
			where: {
				lastUpdate: { gte: activeThreshold },
			},
			include: {
				user: {
					select: {
						id: true,
						username: true,
						firstName: true,
						lastName: true,
					},
				},
			},
		});

		return NextResponse.json(
			activeActivities.map((a) => ({
				userId: a.userId,
				username: a.user.username,
				fullName:
					a.user.firstName || a.user.lastName
						? `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim()
						: a.user.username,
				resourceType: a.resourceType,
				resourceId: a.resourceId,
				lastUpdate: a.lastUpdate,
			})),
		);
	} catch (e) {
		return handleError(e, req);
	}
}

export async function POST(req: Request) {
	try {
		const session = await requireRole('READER');
		const user = session.user as ApiUser;
		const body = await req.json();

		const resourceType = sanitizeString(body.resourceType, 50) || null;
		const resourceId = sanitizeString(body.resourceId, 50) || null;

		await prisma.$transaction([
			prisma.user.update({
				where: { id: user.id! },
				data: { lastSeenAt: new Date() },
			}),
			prisma.userActivity.upsert({
				where: { userId: user.id! },
				create: {
					userId: user.id!,
					resourceType,
					resourceId,
					lastUpdate: new Date(),
				},
				update: {
					resourceType,
					resourceId,
					lastUpdate: new Date(),
				},
			}),
		]);

		return NextResponse.json({ success: true });
	} catch (e) {
		return handleError(e, req);
	}
}
