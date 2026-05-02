import { NextResponse } from 'next/server';
import { type ApiUser, handleError, requireRole } from '@/lib/api/helpers';
import { logAuditAction } from '@/lib/db/prisma/audit-log';
import { prisma } from '@/lib/db/prisma/prisma';
import {
	sanitizeString,
	validateContentType,
	validateSpecimenId,
} from '@/lib/security/input-validator';

function parseJsonOrNull(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	if (typeof value === 'string') return value;
	try {
		return JSON.stringify(value);
	} catch {
		return null;
	}
}

export async function GET(req: Request) {
	try {
		await requireRole('READER');

		const { searchParams } = new URL(req.url);
		const specimenId = validateSpecimenId(searchParams.get('specimenId'));
		const stage = sanitizeString(searchParams.get('stage'), 40);
		const marker = sanitizeString(searchParams.get('marker'), 40);

		if (!specimenId) {
			return NextResponse.json({ error: 'specimenId обязателен' }, { status: 400 });
		}

		const operations = await prisma.workflowOperation.findMany({
			where: {
				specimenId,
				deletedAt: null,
				...(stage ? { stage } : {}),
				...(marker ? { marker } : {}),
			},
			orderBy: { startedAt: 'desc' },
			include: { attachments: true },
		});

		return NextResponse.json(operations);
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
		const stage = sanitizeString(body?.stage, 40);
		const marker = sanitizeString(body?.marker, 40);
		const status = sanitizeString(body?.status, 40) || 'in_progress';

		if (!specimenId) {
			return NextResponse.json({ error: 'specimenId обязателен' }, { status: 400 });
		}
		if (!stage) {
			return NextResponse.json({ error: 'stage обязателен' }, { status: 400 });
		}

		const created = await prisma.workflowOperation.create({
			data: {
				specimenId,
				stage,
				marker,
				status,
				lab: sanitizeString(body?.lab, 100),
				method: sanitizeString(body?.method, 100),
				operator: sanitizeString(body?.operator, 100) || user?.id || null,
				paramsJson: parseJsonOrNull(body?.params),
				addedBy: user?.id || null,
				startedAt: body?.startedAt ? new Date(body.startedAt) : new Date(),
				completedAt: body?.completedAt ? new Date(body.completedAt) : null,
			},
		});

		await logAuditAction({
			userId: user?.id || 'unknown',
			action: 'CREATE_WORKFLOW_OPERATION',
			resourceType: 'WORKFLOW_OPERATION',
			resourceId: created.id,
			details: { specimenId, stage, marker, status },
		});

		return NextResponse.json(created);
	} catch (e) {
		return handleError(e, req);
	}
}
