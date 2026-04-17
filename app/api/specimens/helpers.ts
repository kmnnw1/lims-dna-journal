import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import { clearCache, getCached, setCache } from '@/lib/utilities/cache';

export type ApiUser = { id?: string; role?: string };

// Invalidate all specimen list caches whenever data changes
export function invalidateSpecimenCaches() {
	clearCache('specimens:*');
}

// Вспомогательный хелпер для проверки авторизации и роли
export async function requireRole(required: 'EDITOR' | 'ADMIN' | 'READER' | 'ANY' = 'ANY') {
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

// Извлекаем уникальные значения для suggestions эффективнее
export async function getDistinctFields() {
	const [labs, ops, methods] = await Promise.all([
		prisma.specimen.findMany({
			where: { deletedAt: null },
			select: { extrLab: true },
			distinct: ['extrLab'],
		}),
		prisma.specimen.findMany({
			where: { deletedAt: null },
			select: { extrOperator: true },
			distinct: ['extrOperator'],
		}),
		prisma.specimen.findMany({
			where: { deletedAt: null },
			select: { extrMethod: true },
			distinct: ['extrMethod'],
		}),
	]);
	return {
		labs: labs.map((l: { extrLab: string | null }) => l.extrLab).filter(Boolean),
		operators: ops.map((o: { extrOperator: string | null }) => o.extrOperator).filter(Boolean),
		methods: methods.map((m: { extrMethod: string | null }) => m.extrMethod).filter(Boolean),
	};
}

// Универсальный обработчик ошибок для API
export function handleError(e: unknown) {
	console.error('[API Error]:', e);
	const errorInfo = e as { code?: string; statusCode?: number; message?: string };
	const isPrismaConflict = errorInfo?.code === 'P2002';
	const status =
		typeof errorInfo?.statusCode === 'number'
			? errorInfo.statusCode
			: isPrismaConflict
				? 409
				: 500;
	const message = isPrismaConflict
		? 'Запись с таким ID уже существует'
		: errorInfo?.message || (e instanceof Error ? e.message : 'Ошибка сервера');
	return NextResponse.json({ error: message }, { status });
}

// Создание cache key на основе параметров запроса
export function buildCacheKey(params: any) {
	return `specimens:${JSON.stringify(params)}`;
}

// Централизованная сборка фильтров для Prisma
export function buildSpecimenQuery(params: {
	search?: string;
	filterType?: string;
	operator?: string;
	minConc?: number | null;
	maxConc?: number | null;
}) {
	const where = { deletedAt: null } as any;

	if (params.search) {
		where.OR = [
			{ id: { contains: params.search } },
			{ taxon: { contains: params.search } },
			{ locality: { contains: params.search } },
			{ extrOperator: { contains: params.search } },
			{ extrLab: { contains: params.search } },
			{ extrMethod: { contains: params.search } },
			{ notes: { contains: params.search } },
			{ itsStatus: { contains: params.search } },
		];
	}

	if (params.filterType === 'success') where.itsStatus = '✓';
	if (params.filterType === 'error') where.itsStatus = '✕';

	if (params.operator) where.extrOperator = params.operator;

	// Фильтрация по концентрации (ТЕПЕРЬ НА УРОВНЕ БД, ТАК КАК ТИП FLOAT)
	if (params.minConc !== null || params.maxConc !== null) {
		where.dnaConcentration = {};
		if (params.minConc !== null) where.dnaConcentration.gte = params.minConc;
		if (params.maxConc !== null) where.dnaConcentration.lte = params.maxConc;
	}

	return where;
}

export { getCached, setCache };
