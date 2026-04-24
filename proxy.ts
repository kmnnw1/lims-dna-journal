import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';

/**
 * Определяет пресет rate-limit по пути запроса
 */
function getRateLimitPreset(pathname: string) {
	if (pathname.startsWith('/api/auth')) return RATE_LIMITS.auth;
	if (pathname.startsWith('/api/import') || pathname.startsWith('/api/upload'))
		return RATE_LIMITS.import;
	if (pathname.startsWith('/api/export') || pathname.startsWith('/api/backup'))
		return RATE_LIMITS.export;
	if (pathname.startsWith('/api/')) return RATE_LIMITS.api;
	return null;
}

/**
 * Извлекает IP-адрес клиента для rate limiting
 */
function getClientIp(req: Request): string {
	const forwarded = req.headers.get('x-forwarded-for');
	if (forwarded) return forwarded.split(',')[0].trim();
	const real = req.headers.get('x-real-ip');
	if (real) return real;
	return 'unknown';
}

export default withAuth(
	function proxy(req) {
		const token = req.nextauth.token;
		const isLoginPage = req.nextUrl.pathname === '/login';

		// Принудительный HTTPS в продакшене для защиты от Wireshark
		// Пропускаем для localhost и 127.0.0.1 (для локальной разработки и E2E тестов)
		if (
			process.env.NODE_ENV === 'production' &&
			req.nextUrl.protocol === 'http:' &&
			!req.nextUrl.hostname.includes('localhost') &&
			!req.nextUrl.hostname.includes('127.0.0.1')
		) {
			return NextResponse.redirect(
				`https://${req.nextUrl.host}${req.nextUrl.pathname}${req.nextUrl.search}`,
				301,
			);
		}

		// Redirect authenticated users away from login page
		if (token && isLoginPage) {
			return NextResponse.redirect(new URL('/', req.url));
		}

		// Rate limiting для API-маршрутов
		const preset = getRateLimitPreset(req.nextUrl.pathname);
		if (preset) {
			const clientIp = getClientIp(req);
			const key = `${clientIp}:${req.nextUrl.pathname}`;

			if (!checkRateLimit(key, preset)) {
				return new NextResponse(
					JSON.stringify({ error: 'Превышен лимит запросов. Повторите позже.' }),
					{
						status: 429,
						headers: {
							'Content-Type': 'application/json',
							'Retry-After': '60',
						},
					},
				);
			}
		}
	},
	{
		callbacks: {
			authorized: ({ token }) => {
				return Boolean(token && typeof token === 'object');
			},
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
		 * - api/auth (авторизация)
		 * - статика, иконки, манифесты
		 */
		'/((?!api/auth|_next/static|_next/image|favicon.ico|icon-.*\\.png|icon\\.svg|apple-touch-icon\\.png|manifest\\.json|offline\\.html).*)',
	],
};
