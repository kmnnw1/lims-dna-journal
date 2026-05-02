import { NextResponse } from 'next/server';
import { type ApiUser, handleError, requireRole } from '@/lib/api/helpers';
import { logAuditAction } from '@/lib/db/prisma/audit-log';
import { prisma } from '@/lib/db/prisma/prisma';
import { sanitizeString, validateContentType } from '@/lib/security/input-validator';
import { isOperationStage } from '@/lib/workflow/stages';

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
		const rawIds = Array.isArray(body?.specimenIds) ? body.specimenIds : [];
		const specimenIds = rawIds
			.map((v: unknown) => sanitizeString(v, 100))
			.filter((v: string | null): v is string => Boolean(v));
		const stage = sanitizeString(body?.stage, 40);
		const status = sanitizeString(body?.status, 40) || 'in_progress';
		const lab = sanitizeString(body?.lab, 120);
		const method = sanitizeString(body?.method, 120);
		const operator = sanitizeString(body?.operator, 120);
		const startedAt = body?.startedAt ? new Date(body.startedAt) : new Date();
		const completedAt = body?.completedAt ? new Date(body.completedAt) : null;
		const paramsJson = body?.params ? JSON.stringify(body.params) : null;

		if (!stage) return NextResponse.json({ error: 'stage обязателен' }, { status: 400 });
		if (!isOperationStage(stage)) {
			return NextResponse.json({ error: 'Некорректный stage' }, { status: 400 });
		}
		if (specimenIds.length === 0) {
			return NextResponse.json({ error: 'specimenIds обязателен' }, { status: 400 });
		}

		const created = await prisma.$transaction(
			specimenIds.map((specimenId: string) =>
				prisma.workflowOperation.create({
					data: {
						specimenId,
						stage,
						status,
						lab,
						method,
						operator: operator || user?.id || null,
						startedAt,
						completedAt,
						paramsJson,
						addedBy: user?.id || null,
					},
				}),
			),
		);

		await logAuditAction({
			userId: user?.id || 'unknown',
			action: 'CREATE_WORKFLOW_OPERATION',
			resourceType: 'WORKFLOW_OPERATION_BATCH',
			details: { stage, status, count: created.length, specimenIds },
		});

		return NextResponse.json({ success: true, count: created.length, operations: created });
	} catch (e) {
		return handleError(e, req);
	}
}
