import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

/**
 * Глобальный мидлвар защиты роутов.
 * Отправляет всех неавторизованных пользователей на /login.
 */
export default withAuth(
	function middleware(req) {
		// Здесь можно добавить дополнительную логику ролей, если нужно
		return NextResponse.next();
	},
	{
		callbacks: {
			authorized: ({ token }) => !!token,
		},
		pages: {
			signIn: '/login',
		},
	},
);

export const config = {
	matcher: [
		/*
		 * Защищаем всё приложение за исключением:
		 * - api/auth (эволюция сессии)
		 * - login (страница входа)
		 * - статика и манифесты
		 */
		'/((?!api/auth|login|_next/static|_next/image|favicon.ico|icon-.*\\.png|icon\\.svg|apple-touch-icon\\.png|manifest\\.json).*)',
	],
};
