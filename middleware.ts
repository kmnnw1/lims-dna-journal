import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware для обеспечения безопасности (Security Hardening)
 * - Content Security Policy (CSP)
 * - Rate Limiting (базовый на основе IP)
 * - Защита от кликджекинга и XSS
 */

// Базовое хранилище для Rate Limiting в памяти (очищается при рестарте)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 100; // запросов
const RATE_WINDOW = 60 * 1000; // за 1 минуту

export function middleware(request: NextRequest) {
	const ip = request.ip || 'anonymous';
	const now = Date.now();
	
	// Базовый Rate Limiting
	const rateData = rateLimitMap.get(ip) || { count: 0, lastReset: now };
	if (now - rateData.lastReset > RATE_WINDOW) {
		rateData.count = 0;
		rateData.lastReset = now;
	}
	rateData.count++;
	rateLimitMap.set(ip, rateData);

	if (rateData.count > RATE_LIMIT && !request.nextUrl.pathname.startsWith('/_next')) {
		return new NextResponse('Too Many Requests', { status: 429 });
	}

	const response = NextResponse.next();

	// Security Headers
	const cspHeader = `
		default-src 'self';
		script-src 'self' 'unsafe-inline' 'unsafe-eval';
		style-src 'self' 'unsafe-inline';
		img-src 'self' blob: data: https://*.googleusercontent.com;
		font-src 'self' data: https://fonts.gstatic.com;
		connect-src 'self' https://*.google.com https://*.googleapis.com;
		frame-ancestors 'none';
	`.replace(/\s{2,}/g, ' ').trim();

	response.headers.set('Content-Security-Policy', cspHeader);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

	return response;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (если нужно отдельное управление)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico).*)',
	],
};
