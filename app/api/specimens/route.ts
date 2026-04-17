import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { specimens as specimensTable } from '@/lib/db/schema';
import { count, asc, desc } from 'drizzle-orm';
import { prisma } from '@/lib/database/prisma';
import { logAuditAction } from '@/lib/database/audit-log';
import { buildDrizzleQuery, getDrizzleDistinctFields } from './drizzle-helpers';
import {
    type ApiUser,
    requireRole,
    handleError,
    invalidateSpecimenCaches,
    buildCacheKey,
    getCached,
    setCache,
} from './helpers';

export async function GET(req: Request) {
    try {
        await requireRole('READER');

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '100');
        const search = searchParams.get('search') || '';
        const sortKey = (searchParams.get('sortBy') || 'id') as any;
        const sortDir = searchParams.get('sortOrder') || 'asc';
        const filterType = searchParams.get('filter') || 'all';
        const minConc = searchParams.get('minConc') ? parseFloat(searchParams.get('minConc')!) : null;
        const maxConc = searchParams.get('maxConc') ? parseFloat(searchParams.get('maxConc')!) : null;
        const operator = searchParams.get('operator') || '';

        if (page < 1) {
            return NextResponse.json({ error: 'Номер страницы должен быть не менее 1' }, { status: 400 });
        }
        if (limit < 1 || limit > 1000) {
            return NextResponse.json({ error: 'Размер страницы должен быть от 1 до 1000' }, { status: 400 });
        }

        const cacheKey = buildCacheKey({ page, limit, search, sortKey, sortDir, filterType, minConc, maxConc, operator });
        const cached = getCached(cacheKey);
        if (cached) return NextResponse.json(cached);

        const skip = (page - 1) * limit;
        const where = buildDrizzleQuery({ search, filterType, operator, minConc, maxConc });

        const [results, totalCount, suggestions] = await Promise.all([
            db.select().from(specimensTable)
              .where(where)
              .limit(limit)
              .offset(skip)
              .orderBy(sortDir === 'asc' ? asc(specimensTable[sortKey]) : desc(specimensTable[sortKey])),
            db.select({ count: count() }).from(specimensTable).where(where),
            getDrizzleDistinctFields(),
        ]);

        const total = totalCount[0]?.count || 0;

        const response = {
            specimens: results.map((s) => ({
                ...s,
                taxon: s.taxon || '',
                notes: s.notes || '',
                locality: s.locality || '',
                extrOperator: s.extrOperator || '',
                extrLab: s.extrLab || ''
            })),
            suggestions,
            total,
            page,
            totalPages: Math.max(1, Math.ceil(total / limit))
        };

        setCache(cacheKey, response, 300000);
        return NextResponse.json(response);
    } catch (e: unknown) {
        return handleError(e);
    }
}

export async function POST(request: Request) {
    try {
        const session = await requireRole('EDITOR');
        const data = await request.json();
        const id = data?.id != null ? String(data.id).trim() : '';

        if (!id) {
            return NextResponse.json({ error: 'ID пробы обязателен' }, { status: 400 });
        }
        if (/\s/.test(id)) {
            return NextResponse.json({ error: 'ID не должен содержать пробелов' }, { status: 400 });
        }

        const taxon = data?.taxon || '';
        if (taxon && taxon.trim().length > 0 && taxon.trim().length < 3) {
            return NextResponse.json({ error: 'Таксон должен содержать не менее 3 символов' }, { status: 400 });
        }

        const exists = await prisma.specimen.findUnique({ where: { id } });
        if (exists) {
            return NextResponse.json({ error: 'Проба с таким ID уже есть в базе' }, { status: 409 });
        }

        const created = await prisma.specimen.create({ data });
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
        return handleError(e);
    }
}

export async function PUT(req: Request) {
    try {
        const session = await requireRole('EDITOR');
        const body = await req.json();
        const { id, singleId, updateData, singleStatus, ...restData } = body;

        if (singleId && updateData) {
            await prisma.specimen.update({ where: { id: String(singleId) }, data: updateData });
            invalidateSpecimenCaches();
            return NextResponse.json({ success: true });
        }

        if (singleId && singleStatus !== undefined) {
            const specimen = await prisma.specimen.findUnique({ where: { id: String(singleId) } });
            await prisma.specimen.update({ where: { id: String(singleId) }, data: { itsStatus: singleStatus } });

            const currentUser = session.user as ApiUser | undefined;
            await logAuditAction({
                userId: currentUser?.id || 'unknown',
                action: 'UPDATE_SPECIMEN',
                resourceType: 'SPECIMEN',
                resourceId: String(singleId),
                details: { singleStatus },
                changes: specimen ? { itsStatus: { old: specimen.itsStatus, new: singleStatus } } : undefined,
            });
            invalidateSpecimenCaches();
            return NextResponse.json({ success: true });
        }

        if (id && Object.keys(restData).length > 0) {
            const taxon = restData?.taxon || '';
            if (taxon && taxon.trim().length > 0 && taxon.trim().length < 3) {
                return NextResponse.json({ error: 'Таксон должен содержать не менее 3 символов' }, { status: 400 });
            }

            const oldSpecimen = await prisma.specimen.findUnique({ where: { id: String(id) } });

            delete restData.attempts;
            delete restData.createdAt;
            delete restData.updatedAt;

            await prisma.specimen.update({ where: { id: String(id) }, data: restData });

            const currentUser = session.user as ApiUser | undefined;
            const changes = oldSpecimen
                ? Object.keys(restData).reduce<Record<string, { old: unknown; new: unknown }>>((acc, key) => {
                    acc[key] = { old: (oldSpecimen as Record<string, unknown>)[key], new: restData[key] };
                    return acc;
                }, {})
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
        return handleError(e);
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await requireRole('ADMIN');
        const body = await request.json();
        if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
            const specimensList = await prisma.specimen.findMany({
                where: { id: { in: body.ids.map(String) } },
                select: { id: true, taxon: true },
            });

            await prisma.specimen.updateMany({
                where: { id: { in: body.ids.map(String) } },
                data: { deletedAt: new Date() }
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
        return NextResponse.json({ error: 'Не указаны id для удаления' }, { status: 400 });
    } catch (e: unknown) {
        return handleError(e);
    }
}
