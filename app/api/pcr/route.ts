import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logAuditAction } from '@/lib/database/audit-log';
import { prisma } from '@/lib/database/prisma';
import {
	sanitizeString,
	validateContentType,
	validateSpecimenId,
} from '@/lib/security/input-validator';

type ApiUser = { id?: string; role?: string };

// Helper for auth
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

function handleError(e: unknown) {
	console.error('[PCR API Error]:', e);
	if (e && typeof e === 'object' && 'statusCode' in e) {
		const error = e as { statusCode: number; message: string };
		return NextResponse.json({ error: error.message }, { status: error.statusCode });
	}
	return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
}

export async function GET(req: Request) {
	try {
		await requireRole('READER');
		const { searchParams } = new URL(req.url);
		const specimenId = validateSpecimenId(searchParams.get('specimenId'));

		if (!specimenId) {
			return NextResponse.json(
				{ error: 'Не указан или невалидный specimenId' },
				{ status: 400 },
			);
		}

		const attempts = await prisma.pcrAttempt.findMany({
			where: { specimenId, deletedAt: null },
			orderBy: { date: 'desc' },
		});

		return NextResponse.json(attempts);
	} catch (e) {
		return handleError(e);
	}
}

export async function POST(req: Request) {
	try {
		const session = await requireRole('EDITOR');
		const user = session.user as ApiUser;

		const contentType = req.headers.get('content-type');
		if (!validateContentType(contentType)) {
			return NextResponse.json(
				{ error: 'Content-Type должен быть application/json' },
				{ status: 415 },
			);
		}

		const body = await req.json();

		const specimenId = validateSpecimenId(body.specimenId);
		const marker = sanitizeString(body.marker, 50);
		const result = sanitizeString(body.result, 50);
		const volume = sanitizeString(body.volume, 50);
		const dnaMatrix = sanitizeString(body.dnaMatrix, 100);
		const forwardPrimer = sanitizeString(body.forwardPrimer, 100);
		const reversePrimer = sanitizeString(body.reversePrimer, 100);
		const date = body.date;
		const id = validateSpecimenId(body.id);

		if (!specimenId || !marker) {
			return NextResponse.json({ error: 'specimenId и marker обязательны' }, { status: 400 });
		}

		let attempt;
		if (id) {
			// Редактирование существующей попытки
			const oldAttempt = await prisma.pcrAttempt.findUnique({ where: { id } });
			attempt = await prisma.pcrAttempt.update({
				where: { id },
				data: {
					result: result || undefined,
					volume: volume || undefined,
					dnaMatrix: dnaMatrix || undefined,
					forwardPrimer: forwardPrimer || undefined,
					reversePrimer: reversePrimer || undefined,
					date: date ? new Date(date) : new Date(),
				},
			});

			await logAuditAction({
				userId: user.id!,
				action: 'UPDATE_SPECIMEN',
				resourceType: 'PCR_ATTEMPT',
				resourceId: attempt.id,
				details: { specimenId, marker: oldAttempt?.marker },
				changes: oldAttempt
					? {
							result: { old: oldAttempt.result, new: result },
							marker: { old: oldAttempt.marker, new: marker },
						}
					: undefined,
			});
		} else {
			// Создание новой попытки (уникальности больше нет)
			attempt = await prisma.pcrAttempt.create({
				data: {
					specimenId,
					marker,
					result: result || 'Pending',
					volume: volume || undefined,
					dnaMatrix: dnaMatrix || undefined,
					forwardPrimer: forwardPrimer || undefined,
					reversePrimer: reversePrimer || undefined,
					date: date ? new Date(date) : new Date(),
				},
			});

			await logAuditAction({
				userId: user.id!,
				action: 'CREATE_PCR_ATTEMPT',
				resourceType: 'PCR_ATTEMPT',
				resourceId: attempt.id,
				details: { specimenId, marker, result },
			});
		}

		// Update Specimen Status (берем из последней актуальной попытки для этого маркера)
		const latestAttempt = await prisma.pcrAttempt.findFirst({
			where: { specimenId, marker, deletedAt: null },
			orderBy: { date: 'desc' },
		});

		if (latestAttempt) {
			const statusValue = latestAttempt.result === 'Success' ? '✓' : '✕';
			let statusField = '';
			switch (marker.toUpperCase()) {
				case 'ITS':
					statusField = 'itsStatus';
					break;
				case 'SSU':
					statusField = 'ssuStatus';
					break;
				case 'LSU':
					statusField = 'lsuStatus';
					break;
				case 'MCM7':
					statusField = 'mcm7Status';
					break;
			}
			if (statusField) {
				await prisma.specimen.update({
					where: { id: specimenId },
					data: { [statusField]: statusValue },
				});
			}
		}

		return NextResponse.json(attempt);
	} catch (e) {
		return handleError(e);
	}
}

export async function DELETE(req: Request) {
	try {
		const session = await requireRole('EDITOR');
		const user = session.user as ApiUser;
		const { searchParams } = new URL(req.url);
		const id = validateSpecimenId(searchParams.get('id'));

		if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 });

		const deleted = await prisma.pcrAttempt.update({
			where: { id },
			data: { deletedAt: new Date() },
		});

		await logAuditAction({
			userId: user.id!,
			action: 'DELETE_SPECIMEN',
			resourceType: 'PCR_ATTEMPT',
			resourceId: id,
			details: { marker: deleted.marker, specimenId: deleted.specimenId },
		});

		return NextResponse.json({ success: true });
	} catch (e) {
		return handleError(e);
	}
}
