import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export type ApiUser = { id?: string; role?: string };

/**
 * Проверка авторизации и роли пользователя.
 * Бросает объект с statusCode/message при ошибке.
 */
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

/**
 * Универсальный обработчик ошибок для API-роутов.
 * Обрабатывает Prisma-ошибки (P2002), кастомные ошибки с statusCode,
 * и стандартные Error-объекты.
 */
export function handleError(e: unknown, req?: Request) {
	const errorInfo = e as { code?: string; statusCode?: number; message?: string };
	const isPrismaConflict = errorInfo?.code === 'P2002';
	const status =
		typeof errorInfo?.statusCode === 'number'
			? errorInfo.statusCode
			: isPrismaConflict
				? 409
				: 500;

	// Логгируем в console.error только реальные системные сбои (500+)
	// Операционные ответы безопасности (401, 403, 400) - это штатная работа, а не «Ошибка»
	if (status >= 500) {
		const url = req?.url || 'unknown url';
		const method = req?.method || 'unknown method';
		console.error(`[API Failure] [${method}] ${url}:`, e);
	}

	const message = isPrismaConflict
		? 'Запись с таким ID уже существует'
		: errorInfo?.message || (e instanceof Error ? e.message : 'Ошибка сервера');

	return NextResponse.json({ error: message }, { status });
}

/**
 * Очистка всех кэшей списка образцов.
 */
import { clearCache } from '@/lib/utilities/cache';
export function invalidateSpecimenCaches() {
	clearCache('specimens:*');
}
