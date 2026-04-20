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
