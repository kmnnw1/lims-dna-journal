import { NextResponse } from 'next/server';
import { type ApiUser, handleError, requireRole } from '@/lib/api/helpers';
import { logAuditAction } from '@/lib/db/prisma/audit-log';
import { prisma } from '@/lib/db/prisma/prisma';
import {
	sanitizeString,
	validateContentType,
	validateSpecimenId,
} from '@/lib/security/input-validator';

// Разрешенные типы маркеров
const ALLOWED_MARKERS = ['ITS', 'SSU', 'LSU', 'MCM7'];

export async function GET(req: Request) {
	try {
		await requireRole('READER');
		const { searchParams } = new URL(req.url);
		const specimenId = validateSpecimenId(searchParams.get('specimenId'));

		if (!specimenId) {
			throw { statusCode: 400, message: 'Не указан или невалидный specimenId' };
		}

		const attempts = await prisma.pCRAttempt.findMany({
			where: { specimenId, deletedAt: null },
			orderBy: { date: 'desc' },
		});

		return NextResponse.json(attempts);
	} catch (e) {
		return handleError(e, req);
	}
}

export async function POST(req: Request) {
	try {
		const session = await requireRole('EDITOR');
		const user = session.user as ApiUser;

		const contentType = req.headers.get('content-type');
		if (!validateContentType(contentType)) {
			throw { statusCode: 415, message: 'Content-Type должен быть application/json' };
		}

		const body = await req.json();

		const specimenId = validateSpecimenId(body.specimenId);
		const rawMarker = sanitizeString(body.marker, 20)?.toUpperCase() || '';
		const result = sanitizeString(body.result, 50);
		const volume = sanitizeString(body.volume, 50);
		const dnaMatrix = sanitizeString(body.dnaMatrix, 100);
		const forwardPrimer = sanitizeString(body.forwardPrimer, 100);
		const reversePrimer = sanitizeString(body.reversePrimer, 100);
		const date = body.date;
		const id = validateSpecimenId(body.id);

		if (!specimenId) {
			throw { statusCode: 400, message: 'specimenId обязателен и должен быть валидным' };
		}

		if (!rawMarker || !ALLOWED_MARKERS.includes(rawMarker)) {
			throw {
				statusCode: 400,
				message: `Недопустимый маркер. Разрешены: ${ALLOWED_MARKERS.join(', ')}`,
			};
		}

		let attempt;
		if (id) {
			// Редактирование существующей попытки
			const oldAttempt = await prisma.pCRAttempt.findUnique({ where: { id } });
			if (!oldAttempt) throw { statusCode: 404, message: 'Попытка ПЦР не найдена' };

			attempt = await prisma.pCRAttempt.update({
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
				details: { specimenId, marker: oldAttempt.marker },
				changes: {
					result: { old: oldAttempt.result, new: result },
				},
			});
		} else {
			// Создание новой попытки
			attempt = await prisma.pCRAttempt.create({
				data: {
					specimenId,
					marker: rawMarker,
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
				details: { specimenId, marker: rawMarker, result },
			});
		}

		// Обновляем статус пробы на основе результата ПЦР
		const latestAttempt = await prisma.pCRAttempt.findFirst({
			where: { specimenId, marker: rawMarker, deletedAt: null },
			orderBy: { date: 'desc' },
		});

		if (latestAttempt) {
			const statusValue = latestAttempt.result === 'Success' ? '✓' : '✕';
			let statusField = '';
			switch (rawMarker) {
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
		return handleError(e, req);
	}
}

export async function DELETE(req: Request) {
	try {
		const session = await requireRole('EDITOR');
		const user = session.user as ApiUser;
		const { searchParams } = new URL(req.url);
		const id = validateSpecimenId(searchParams.get('id'));

		if (!id) {
			throw { statusCode: 400, message: 'id обязателен и должен быть валидным' };
		}

		const attempt = await prisma.pCRAttempt.findUnique({ where: { id } });
		if (!attempt) throw { statusCode: 404, message: 'Попытка ПЦР не найдена' };

		await prisma.pCRAttempt.update({
			where: { id },
			data: { deletedAt: new Date() },
		});

		await logAuditAction({
			userId: user.id!,
			action: 'DELETE_SPECIMEN',
			resourceType: 'PCR_ATTEMPT',
			resourceId: id,
			details: { marker: attempt.marker, specimenId: attempt.specimenId },
		});

		return NextResponse.json({ success: true });
	} catch (e) {
		return handleError(e, req);
	}
}
