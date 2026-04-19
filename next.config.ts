import type { NextConfig } from 'next';

const securityHeaders = [
	{ key: 'X-Frame-Options', value: 'DENY' },
	{ key: 'X-Content-Type-Options', value: 'nosniff' },
	{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
	{ key: 'X-XSS-Protection', value: '0' },
	{
		key: 'Permissions-Policy',
		value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=()',
	},
	{
		key: 'Content-Security-Policy',
		value: [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"font-src 'self' https://fonts.gstatic.com",
			"img-src 'self' data: blob:",
			"connect-src 'self'",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'",
		].join('; '),
	},
	{
		key: 'Strict-Transport-Security',
		value: 'max-age=31536000; includeSubDomains; preload',
	},
];

const nextConfig: NextConfig = {
	output: 'standalone',
	experimental: {
		optimizePackageImports: ['lucide-react'],
	},
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: securityHeaders,
			},
		];
	},
};

export default nextConfig;
