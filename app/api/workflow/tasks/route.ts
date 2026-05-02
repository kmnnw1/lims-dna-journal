import { NextResponse } from 'next/server';
import { type ApiUser, handleError, requireRole } from '@/lib/api/helpers';
import { logAuditAction } from '@/lib/db/prisma/audit-log';
import { prisma } from '@/lib/db/prisma/prisma';
import {
	sanitizeString,
	validateContentType,
	validateSpecimenId,
} from '@/lib/security/input-validator';

function parseIntOrDefault(value: unknown, fallback: number): number {
	const n = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
	try {
		await requireRole('READER');

		const { searchParams } = new URL(req.url);
		const marker = sanitizeString(searchParams.get('marker'), 40);
		const status = sanitizeString(searchParams.get('status'), 40);
		const assigneeId = sanitizeString(searchParams.get('assigneeId'), 100);

		const tasks = await prisma.amplificationTask.findMany({
			where: {
				deletedAt: null,
				...(marker ? { marker } : {}),
				...(status ? { status } : {}),
				...(assigneeId ? { assigneeId } : {}),
			},
			orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
		});

		return NextResponse.json(tasks);
	} catch (e) {
		return handleError(e, req);
	}
}

export async function POST(req: Request) {
	try {
		const session = await requireRole('EDITOR');
		const user = session.user as ApiUser | undefined;

		const contentType = req.headers.get('content-type');
		if (!validateContentType(contentType)) {
			return NextResponse.json(
				{ error: 'Content-Type должен быть application/json' },
				{ status: 415 },
			);
		}

		const body = await req.json();
		const specimenId = validateSpecimenId(body?.specimenId);
		const marker = sanitizeString(body?.marker, 40);
		if (!specimenId)
			return NextResponse.json({ error: 'specimenId обязателен' }, { status: 400 });
		if (!marker) return NextResponse.json({ error: 'marker обязателен' }, { status: 400 });

		const created = await prisma.amplificationTask.create({
			data: {
				specimenId,
				marker,
				forwardPrimer: sanitizeString(body?.forwardPrimer, 100),
				reversePrimer: sanitizeString(body?.reversePrimer, 100),
				dnaMatrix: sanitizeString(body?.dnaMatrix, 100),
				volume: sanitizeString(body?.volume, 50),
				paramsJson: body?.params ? JSON.stringify(body.params) : null,
				priority: parseIntOrDefault(body?.priority, 3),
				assigneeId: sanitizeString(body?.assigneeId, 100),
				status: 'queued',
			},
		});

		await logAuditAction({
			userId: user?.id || 'unknown',
			action: 'CREATE_AMPLIFICATION_TASK',
			resourceType: 'AMPLIFICATION_TASK',
			resourceId: created.id,
			details: {
				specimenId,
				marker,
				priority: created.priority,
				assigneeId: created.assigneeId,
			},
		});

		return NextResponse.json(created);
	} catch (e) {
		return handleError(e, req);
	}
}

export async function PUT(req: Request) {
	try {
		const session = await requireRole('EDITOR');
		const user = session.user as ApiUser | undefined;

		const contentType = req.headers.get('content-type');
		if (!validateContentType(contentType)) {
			return NextResponse.json(
				{ error: 'Content-Type должен быть application/json' },
				{ status: 415 },
			);
		}

		const body = await req.json();
		const id = sanitizeString(body?.id, 80);
		const action = sanitizeString(body?.action, 30);

		if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 });
		if (!action) return NextResponse.json({ error: 'action обязателен' }, { status: 400 });

		if (action === 'take') {
			const updated = await prisma.$transaction(async (tx) => {
				const task = await tx.amplificationTask.update({
					where: { id },
					data: {
						status: 'in_progress',
						takenAt: new Date(),
						takenBy: user?.id || null,
					},
				});
				await tx.workflowOperation.create({
					data: {
						specimenId: task.specimenId,
						stage: 'AMPLIFICATION',
						status: 'in_progress',
						marker: task.marker,
						operator: user?.id || null,
						paramsJson: JSON.stringify({
							taskId: task.id,
							forwardPrimer: task.forwardPrimer,
							reversePrimer: task.reversePrimer,
							dnaMatrix: task.dnaMatrix,
							volume: task.volume,
							priority: task.priority,
						}),
						addedBy: user?.id || null,
					},
				});
				return task;
			});
			await logAuditAction({
				userId: user?.id || 'unknown',
				action: 'TAKE_AMPLIFICATION_TASK',
				resourceType: 'AMPLIFICATION_TASK',
				resourceId: id,
				details: { specimenId: updated.specimenId, marker: updated.marker },
			});
			return NextResponse.json(updated);
		}

		if (action === 'complete') {
			const updated = await prisma.$transaction(async (tx) => {
				const task = await tx.amplificationTask.update({
					where: { id },
					data: { status: 'done' },
				});
				await tx.workflowOperation.create({
					data: {
						specimenId: task.specimenId,
						stage: 'AMPLIFICATION',
						status: 'ok',
						marker: task.marker,
						operator: user?.id || null,
						completedAt: new Date(),
						paramsJson: JSON.stringify({
							taskId: task.id,
							transition: 'complete',
						}),
						addedBy: user?.id || null,
					},
				});
				return task;
			});
			await logAuditAction({
				userId: user?.id || 'unknown',
				action: 'COMPLETE_AMPLIFICATION_TASK',
				resourceType: 'AMPLIFICATION_TASK',
				resourceId: id,
				details: { specimenId: updated.specimenId, marker: updated.marker },
			});
			return NextResponse.json(updated);
		}

		if (action === 'cancel') {
			const updated = await prisma.amplificationTask.update({
				where: { id },
				data: { status: 'cancelled' },
			});
			await logAuditAction({
				userId: user?.id || 'unknown',
				action: 'CANCEL_AMPLIFICATION_TASK',
				resourceType: 'AMPLIFICATION_TASK',
				resourceId: id,
				details: { specimenId: updated.specimenId, marker: updated.marker },
			});
			return NextResponse.json(updated);
		}

		return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
	} catch (e) {
		return handleError(e, req);
	}
}
