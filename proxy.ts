import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { applySecurityHeaders } from '@/lib/security/headers';
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

export const proxy = withAuth(
	function proxy(req) {
		const token = req.nextauth.token;
		const isLoginPage = req.nextUrl.pathname === '/login';

		console.log(
			`[PROXY EXEC] Path: ${req.nextUrl.pathname}, Hostname: ${req.nextUrl.hostname}, Protocol: ${req.nextUrl.protocol}, env: ${process.env.NODE_ENV}`,
		);

		// Принудительный HTTPS в продакшене для защиты от Wireshark
		// Пропускаем для localhost, 127.0.0.1, 0.0.0.0 и CI (для локальной разработки и E2E тестов)
		const isLocalHost =
			req.nextUrl.hostname.includes('localhost') ||
			req.nextUrl.hostname.includes('127.0.0.1') ||
			req.nextUrl.hostname.includes('0.0.0.0');

		const isCI = process.env.CI === 'true' || process.env.CI === '1' || Boolean(process.env.CI);

		if (process.env.NODE_ENV === 'production' && req.nextUrl.protocol === 'http:') {
			if (isCI || isLocalHost) {
				console.log(
					`[PROXY SKIP] Skipping HTTPS redirect (CI: ${isCI}, Local: ${isLocalHost}) for ${req.nextUrl.hostname}`,
				);
			} else {
				console.log(`[PROXY REDIRECT] Forcing HTTPS redirect for ${req.nextUrl.hostname}`);
				return NextResponse.redirect(
					`https://${req.nextUrl.host}${req.nextUrl.pathname}${req.nextUrl.search}`,
					301,
				);
			}
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

		// Если лимиты не превышены, применяем security-заголовки
		const response = NextResponse.next();
		return applySecurityHeaders(response, req);
	},
	{
		callbacks: {
			authorized: ({ token, req }) => {
				const isLoginPage = req.nextUrl.pathname === '/login';
				const hasToken = Boolean(token && typeof token === 'object');

				console.log(
					`[PROXY DEBUG] Path: ${req.nextUrl.pathname}, Has Token: ${hasToken}, Is Login Page: ${isLoginPage}`,
				);

				// Разрешаем доступ к странице логина в любом случае (редирект залогиненных сделаем в proxy)
				if (isLoginPage) return true;
				return hasToken;
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
		 * - login (страница входа)
		 * - статика, иконки, манифесты
		 */
		'/((?!api/auth|login|_next/static|_next/image|favicon.ico|icon-.*\\.png|icon\\.svg|apple-touch-icon\\.png|manifest\\.json|offline\\.html).*)',
	],
};
