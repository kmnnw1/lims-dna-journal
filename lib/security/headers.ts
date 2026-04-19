/**
 * Security Headers — защита от XSS, Clickjacking, MIME-sniffing и других векторов атаки
 * Вдохновлено OWASP Secure Headers Project
 */

import { type NextRequest, NextResponse } from 'next/server';

/** Набор безопасных HTTP-заголовков для каждого ответа */
const SECURITY_HEADERS: Record<string, string> = {
	// Запрет фреймирования (Clickjacking protection)
	'X-Frame-Options': 'DENY',
	// Запрет MIME-sniffing
	'X-Content-Type-Options': 'nosniff',
	// Минимизация утечки Referer
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	// Запрет распознавания контента как скрипта (IE legacy)
	'X-XSS-Protection': '0',
	// Разрешения API браузера
	'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(), interest-cohort=()',
	// Content Security Policy — строгая
	'Content-Security-Policy': [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js требует unsafe-eval в dev
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"img-src 'self' data: blob:",
		"connect-src 'self'",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'",
	].join('; '),
};

/** HSTS — включается только в production */
const HSTS_HEADER = 'max-age=31536000; includeSubDomains; preload';

/**
 * Применяет security-заголовки к ответу
 */
export function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}

	// HSTS только через HTTPS
	if (request.nextUrl.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', HSTS_HEADER);
	}

	return response;
}
