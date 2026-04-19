/**
 * Rate Limiter — Token Bucket алгоритм
 * Защита от brute-force атак на API-эндпоинты
 */

interface RateLimitConfig {
	/** Максимальное количество запросов в окне */
	maxRequests: number;
	/** Размер окна в миллисекундах */
	windowMs: number;
}

interface BucketEntry {
	tokens: number;
	lastRefill: number;
}

const buckets = new Map<string, BucketEntry>();

// Периодическая очистка устаревших записей (каждые 5 минут)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number): void {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL) return;
	lastCleanup = now;

	for (const [key, entry] of buckets) {
		if (now - entry.lastRefill > windowMs * 2) {
			buckets.delete(key);
		}
	}
}

/**
 * Проверяет, допустим ли запрос для данного ключа (IP/userId)
 * @returns `true` — запрос разрешён, `false` — лимит превышен
 */
export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
	const now = Date.now();
	cleanup(config.windowMs);

	const existing = buckets.get(key);
	if (!existing) {
		buckets.set(key, { tokens: config.maxRequests - 1, lastRefill: now });
		return true;
	}

	// Пополняем токены пропорционально времени
	const elapsed = now - existing.lastRefill;
	const refillRate = config.maxRequests / config.windowMs;
	const newTokens = Math.min(config.maxRequests, existing.tokens + elapsed * refillRate);

	existing.tokens = newTokens;
	existing.lastRefill = now;

	if (existing.tokens < 1) {
		return false;
	}

	existing.tokens -= 1;
	return true;
}

/** Пресеты для различных эндпоинтов */
export const RATE_LIMITS = {
	/** Авторизация: 5 попыток в минуту */
	auth: { maxRequests: 5, windowMs: 60_000 },
	/** Стандартные API: 120 запросов в минуту */
	api: { maxRequests: 120, windowMs: 60_000 },
	/** Импорт файлов: 3 запроса в минуту */
	import: { maxRequests: 3, windowMs: 60_000 },
	/** Экспорт данных: 10 запросов в минуту */
	export: { maxRequests: 10, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;
