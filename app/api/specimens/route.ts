import { asc, count, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle/drizzle';
import { specimens as specimensTable } from '@/lib/db/drizzle/schema';
import { logAuditAction } from '@/lib/db/prisma/audit-log';
import { prisma } from '@/lib/db/prisma/prisma';
import {
	sanitizeString,
	validateContentType,
	validatePagination,
	validateSearchQuery,
	validateSpecimenId,
} from '@/lib/security/input-validator';
import { buildDrizzleQuery, getDrizzleDistinctFields } from './drizzle-helpers';
import {
	type ApiUser,
	buildCacheKey,
	getCached,
	handleError,
	invalidateSpecimenCaches,
	requireRole,
	setCache,
} from './helpers';

export async function GET(req: Request) {
	try {
		await requireRole('READER');

		const { searchParams } = new URL(req.url);
		const { page, limit } = validatePagination(
			searchParams.get('page'),
			searchParams.get('limit'),
		);
		const search = validateSearchQuery(searchParams.get('search'));
		const sortKey = sanitizeString(
			searchParams.get('sortBy') || 'id',
			50,
		) as keyof typeof specimensTable;
		const sortDir = sanitizeString(searchParams.get('sortOrder') || 'asc', 10);
		const filterType = sanitizeString(searchParams.get('filter') || 'all', 30);
		const minConc = searchParams.get('minConc')
			? parseFloat(searchParams.get('minConc')!)
			: null;
		const maxConc = searchParams.get('maxConc')
			? parseFloat(searchParams.get('maxConc')!)
			: null;
		const operator = sanitizeString(searchParams.get('operator') || '', 100);

		const cacheKey = buildCacheKey({
			page,
			limit,
			search,
			sortKey,
			sortDir,
			filterType,
			minConc,
			maxConc,
			operator,
		});
		const cached = getCached(cacheKey);
		if (cached) return NextResponse.json(cached);

		const skip = (page - 1) * limit;
		const where = buildDrizzleQuery({ search, filterType, operator, minConc, maxConc });
		const whereStats = buildDrizzleQuery({
			search,
			filterType: 'all',
			operator,
			minConc,
			maxConc,
		});

		const [results, totalCount, statsData, suggestions] = await Promise.all([
			db
				.select()
				.from(specimensTable)
				.where(where)
				.limit(limit)
				.offset(skip)
				.orderBy(
					sortDir === 'asc'
						? // biome-ignore lint/suspicious/noExplicitAny: dynamic column selection in Drizzle
							asc((specimensTable as any)[sortKey])
						: // biome-ignore lint/suspicious/noExplicitAny: dynamic column selection in Drizzle
							desc((specimensTable as any)[sortKey]),
				),
			db.select({ count: count() }).from(specimensTable).where(where),
			db
				.select({ itsStatus: specimensTable.itsStatus })
				.from(specimensTable)
				.where(whereStats),
			getDrizzleDistinctFields(),
		]);

		const total = totalCount[0]?.count || 0;
		const stats = {
			total: statsData.length,
			successful: statsData.filter((s) => s.itsStatus === '✓').length,
			others: statsData.filter(
				(s) => s.itsStatus === '✕' || s.itsStatus === '?' || s.itsStatus === null,
			).length,
		};

		const response = {
			specimens: results.map((s) => ({
				...s,
				taxon: s.taxon || '',
				notes: s.notes || '',
				locality: s.locality || '',
				extrOperator: s.extrOperator || '',
				extrLab: s.extrLab || '',
			})),
			suggestions,
			total,
			stats,
			page,
			totalPages: Math.max(1, Math.ceil(total / limit)),
		};

		setCache(cacheKey, response, 300000);
		return NextResponse.json(response);
	} catch (e: unknown) {
		return handleError(e, req);
	}
}

export async function POST(request: Request) {
	try {
		const session = await requireRole('EDITOR');

		const contentType = request.headers.get('content-type');
		if (!validateContentType(contentType)) {
			return NextResponse.json(
				{ error: 'Content-Type должен быть application/json' },
				{ status: 415 },
			);
		}

		const rawData = await request.json();
		const id = validateSpecimenId(rawData?.id);

		if (!id) {
			return NextResponse.json({ error: 'ID пробы обязателен' }, { status: 400 });
		}
		if (/\s/.test(id)) {
			return NextResponse.json({ error: 'ID не должен содержать пробелов' }, { status: 400 });
		}

		const taxon = sanitizeString(rawData?.taxon);
		if (taxon && taxon.trim().length > 0 && taxon.trim().length < 3) {
			throw { statusCode: 400, message: 'Таксон должен содержать не менее 3 символов' };
		}

		const exists = await prisma.specimen.findUnique({ where: { id } });
		if (exists) {
			return NextResponse.json(
				{ error: 'Проба с таким ID уже есть в базе' },
				{ status: 409 },
			);
		}

		// Санитизация всех строковых полей перед записью
		const sanitizedData: Record<string, unknown> = { id };
		const stringFields = [
			'taxon',
			'locality',
			'collector',
			'extrLab',
			'extrOperator',
			'extrMethod',
			'extrDateRaw',
			'dnaMeter',
			'dnaProfile',
			'measComm',
			'herbarium',
			'accessionNumber',
			'collectionNumber',
			'connections',
			'labNo',
			'notes',
			'collectNotes',
		] as const;
		for (const field of stringFields) {
			if (rawData[field] !== undefined) {
				sanitizedData[field] = sanitizeString(rawData[field]) || null;
			}
		}
		// Числовые поля (без санитизации строк)
		if (rawData.dnaConcentration !== undefined) {
			sanitizedData.dnaConcentration = rawData.dnaConcentration;
		}

		const created = await prisma.specimen.create({
			data: {
				...sanitizedData,
				labTechnicianId: (session.user as ApiUser)?.id,
			},
		});
		invalidateSpecimenCaches();

		const currentUser = session.user as ApiUser | undefined;
		await logAuditAction({
			userId: currentUser?.id || 'unknown',
			action: 'CREATE_SPECIMEN',
			resourceType: 'SPECIMEN',
			resourceId: created.id,
			details: { id: created.id, taxon: created.taxon },
		});

		return NextResponse.json(created);
	} catch (e: unknown) {
		return handleError(e, request);
	}
}

export async function PUT(req: Request) {
	try {
		const session = await requireRole('EDITOR');

		const contentType = req.headers.get('content-type');
		if (!validateContentType(contentType)) {
			return NextResponse.json(
				{ error: 'Content-Type должен быть application/json' },
				{ status: 415 },
			);
		}

		const body = await req.json();
		const { id, singleId, updateData, singleStatus, ...restData } = body;

		if (singleId && updateData) {
			const safeSingleId = validateSpecimenId(singleId);
			if (!safeSingleId) {
				return NextResponse.json({ error: 'Невалидный ID пробы' }, { status: 400 });
			}
			await prisma.specimen.update({ where: { id: safeSingleId }, data: updateData });
			invalidateSpecimenCaches();
			return NextResponse.json({ success: true });
		}

		if (singleId && singleStatus !== undefined) {
			const specimen = await prisma.specimen.findUnique({ where: { id: String(singleId) } });
			await prisma.specimen.update({
				where: { id: String(singleId) },
				data: { itsStatus: singleStatus },
			});

			const currentUser = session.user as ApiUser | undefined;
			await logAuditAction({
				userId: currentUser?.id || 'unknown',
				action: 'UPDATE_SPECIMEN',
				resourceType: 'SPECIMEN',
				resourceId: String(singleId),
				details: { singleStatus },
				changes: specimen
					? { itsStatus: { old: specimen.itsStatus, new: singleStatus } }
					: undefined,
			});
			invalidateSpecimenCaches();
			return NextResponse.json({ success: true });
		}

		if (id && Object.keys(restData).length > 0) {
			const taxon = sanitizeString(restData?.taxon || '');
			if (taxon && taxon.trim().length > 0 && taxon.trim().length < 3) {
				throw { statusCode: 400, message: 'Таксон должен содержать не менее 3 символов' };
			}

			const oldSpecimen = await prisma.specimen.findUnique({ where: { id: String(id) } });

			delete restData.attempts;
			delete restData.createdAt;
			delete restData.updatedAt;

			await prisma.specimen.update({ where: { id: String(id) }, data: restData });

			const currentUser = session.user as ApiUser | undefined;
			const changes = oldSpecimen
				? Object.keys(restData).reduce<Record<string, { old: unknown; new: unknown }>>(
						(acc, key) => {
							acc[key] = {
								old: (oldSpecimen as Record<string, unknown>)[key],
								new: restData[key],
							};
							return acc;
						},
						{},
					)
				: undefined;

			await logAuditAction({
				userId: currentUser?.id || 'unknown',
				action: 'UPDATE_SPECIMEN',
				resourceType: 'SPECIMEN',
				resourceId: String(id),
				details: restData,
				changes,
			});

			invalidateSpecimenCaches();
			return NextResponse.json({ success: true });
		}

		return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
	} catch (e: unknown) {
		return handleError(e, req);
	}
}

export async function DELETE(request: Request) {
	try {
		const session = await requireRole('ADMIN');
		const body = await request.json();
		if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
			const validIds = body.ids
				.map((rawId: unknown) => validateSpecimenId(rawId))
				.filter((v: string | null): v is string => v !== null);
			if (validIds.length === 0) {
				return NextResponse.json(
					{ error: 'Ни один ID не прошёл валидацию' },
					{ status: 400 },
				);
			}
			const specimensList = await prisma.specimen.findMany({
				where: { id: { in: validIds } },
				select: { id: true, taxon: true },
			});

			await prisma.specimen.updateMany({
				where: { id: { in: validIds } },
				data: { deletedAt: new Date() },
			});

			const currentUser = session.user as ApiUser | undefined;
			for (const specimen of specimensList) {
				await logAuditAction({
					userId: currentUser?.id || 'unknown',
					action: 'DELETE_SPECIMEN',
					resourceType: 'SPECIMEN',
					resourceId: specimen.id,
					details: { taxon: specimen.taxon },
				});
			}

			invalidateSpecimenCaches();
			return NextResponse.json({ success: true });
		}
		throw { statusCode: 400, message: 'Не указаны id для удаления' };
	} catch (e: unknown) {
		return handleError(e, request);
	}
}
