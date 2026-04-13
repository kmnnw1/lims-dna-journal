import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import { getCached, setCache, clearCache } from '@/lib/utilities/cache';

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
export function handleError(e: unknown) {
	console.error('[API Error]:', e);
	const errorInfo = e as { code?: string; statusCode?: number; message?: string };
	const isPrismaConflict = errorInfo?.code === 'P2002';
	const status = typeof errorInfo?.statusCode === 'number' ? errorInfo.statusCode : isPrismaConflict ? 409 : 500;
	const message = isPrismaConflict
		? 'Запись с таким ID уже существует'
		: errorInfo?.message || (e instanceof Error ? e.message : 'Ошибка сервера');
	return NextResponse.json({ error: message }, { status });
}

// Создание cache key на основе параметров запроса
export function buildCacheKey(params: {
	page: number;
	limit: number;
	search: string;
	sortKey: string;
	sortDir: string;
	filterType: string;
}) {
	return `specimens:${params.page}:${params.limit}:${params.search}:${params.sortKey}:${params.sortDir}:${params.filterType}`;
}

export { getCached, setCache };
