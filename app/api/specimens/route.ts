import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Вспомогательный хелпер для проверки авторизации и роли
async function requireRole(required: 'EDITOR' | 'ADMIN' | 'READER' | 'ANY' = 'ANY') {
	const session = await getServerSession(authOptions);
	if (!session) throw { statusCode: 401, message: 'Требуется вход в систему' };
	const role = (session.user as any)?.role;
	if (required === 'ADMIN' && role !== 'ADMIN')
		throw { statusCode: 403, message: 'Доступ запрещён (требуется ADMIN)' };
	if (required === 'EDITOR' && !['ADMIN', 'EDITOR'].includes(role))
		throw { statusCode: 403, message: 'Доступ запрещён (требуется EDITOR)' };
	if (required === 'READER' && !['ADMIN', 'EDITOR', 'READER'].includes(role))
		throw { statusCode: 403, message: 'Доступ запрещён (требуется READER)' };
	return session;
}

// Извлекаем уникальные значения для suggestions эффективнее
async function getDistinctFields() {
	const [labs, ops, methods] = await Promise.all([
		prisma.specimen.findMany({ select: { extrLab: true }, distinct: ['extrLab'] }),
		prisma.specimen.findMany({ select: { extrOperator: true }, distinct: ['extrOperator'] }),
		prisma.specimen.findMany({ select: { extrMethod: true }, distinct: ['extrMethod'] }),
	]);
	return {
		labs: labs.map((l: { extrLab: string | null }) => l.extrLab).filter(Boolean),
		operators: ops.map((o: { extrOperator: string | null }) => o.extrOperator).filter(Boolean),
		methods: methods.map((m: { extrMethod: string | null }) => m.extrMethod).filter(Boolean),
	};
}

// Универсальный обработчик ошибок для API
function handleError(e: any) {
	console.error('[API Error]:', e); // Логируем реальную причину падения в терминал
	const isPrismaConflict = e?.code === 'P2002';
	const status = typeof e?.statusCode === 'number' ? e.statusCode : isPrismaConflict ? 409 : 500;
	const message = isPrismaConflict
		? 'Запись с таким ID уже существует'
		: e?.message || 'Ошибка сервера';
	return NextResponse.json({ error: message }, { status });
}

export async function GET(req: Request) {
	try {
		await requireRole('READER');
		
		// 1. Получаем параметры из URL для пагинации и поиска
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '100'); // По умолчанию отдаем 100
		const search = searchParams.get('search') || '';
		const sortKey = searchParams.get('sortBy') || 'id';
		const sortDir = searchParams.get('sortOrder') || 'asc';
		const filterType = searchParams.get('filter') || 'all';

		const skip = (page - 1) * limit;

		// 2. Строим условия фильтрации (WHERE)
		const where: any = {};
		
		if (search) {
			where.OR = [
				{ id: { contains: search } },
				{ taxon: { contains: search } }
			];
		}

		if (filterType === 'success') where.itsStatus = '✓';
		if (filterType === 'error') where.itsStatus = '✕';
		// Если нужно избранное: if (filterType === 'fav') where.isFavorite = true;

		// 3. Строим условия сортировки (ORDER BY)
		const orderBy: any = {};
		if (sortKey) {
			orderBy[sortKey] = sortDir === 'asc' ? 'asc' : 'desc';
		}

		// 4. Выполняем запросы параллельно: данные, счетчик и подсказки
		const [specimens, total, suggestions] = await Promise.all([
			prisma.specimen.findMany({
				where,
				skip,
				take: limit,
				orderBy,
				include: { attempts: true },
			}),
			prisma.specimen.count({ where }),
			getDistinctFields()
		]);

		return NextResponse.json({ 
			specimens, 
			suggestions,
			total,
			page,
			totalPages: Math.ceil(total / limit)
		});
	} catch (e: any) {
		return handleError(e);
	}
}

export async function POST(request: Request) {
	try {
		await requireRole('EDITOR');
		const data = await request.json();
		const id = data?.id != null ? String(data.id).trim() : '';
		if (!id) {
			return NextResponse.json({ error: 'ID пробы обязателен' }, { status: 400 });
		}

		const exists = await prisma.specimen.findUnique({ where: { id } });
		if (exists) {
			return NextResponse.json(
				{ error: 'Проба с таким ID уже есть в базе' },
				{ status: 409 },
			);
		}

		const created = await prisma.specimen.create({ data });
		return NextResponse.json(created);
	} catch (e: any) {
		return handleError(e);
	}
}

export async function PUT(request: Request) {
	try {
		await requireRole('EDITOR');
		const body = await request.json();
		
		// Извлекаем как старые параметры, так и новые
		const { ids, updateData, singleId, singleStatus, newAttempt, id, ...restData } = body;

		if (newAttempt) {
			await prisma.pcrAttempt.create({ data: newAttempt });
			return NextResponse.json({ success: true });
		}

		if (singleId && singleStatus !== undefined) {
			await prisma.specimen.update({
				where: { id: singleId },
				data: { itsStatus: singleStatus },
			});
			return NextResponse.json({ success: true });
		}

		if (singleId && updateData) {
			await prisma.specimen.update({ where: { id: singleId }, data: updateData });
			return NextResponse.json({ success: true });
		}

		if (ids && Array.isArray(ids) && updateData) {
			await prisma.specimen.updateMany({ where: { id: { in: ids } }, data: updateData });
			return NextResponse.json({ success: true });
		}

		// НОВЫЙ БЛОК: Для редактирования через нашу новую модалку
		if (id && Object.keys(restData).length > 0) {
			await prisma.specimen.update({ where: { id: String(id) }, data: restData });
			return NextResponse.json({ success: true });
		}

		return NextResponse.json({ error: 'Неверные параметры запроса' }, { status: 400 });
	} catch (e: any) {
		return handleError(e);
	}
}

export async function DELETE(request: Request) {
	try {
		await requireRole('ADMIN');
		const body = await request.json();
		if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
			await prisma.specimen.deleteMany({ where: { id: { in: body.ids.map(String) } } });
			return NextResponse.json({ success: true });
		}
		return NextResponse.json({ error: 'Не указаны id для удаления' }, { status: 400 });
	} catch (e: any) {
		return handleError(e);
	}
}
