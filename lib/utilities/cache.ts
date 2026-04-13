/**
 * Simple in-memory cache for API responses with TTL (time-to-live)
 * Used to reduce database queries for frequently accessed data
 */

interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get value from cache if it exists and hasn't expired
 */
export function getCached<T>(key: string): T | null {
	const entry = cache.get(key);
	if (!entry) return null;
	
	// Check if entry has expired
	if (Date.now() > entry.expiresAt) {
		cache.delete(key);
		return null;
	}
	
	return entry.data as T;
}

/**
 * Set value in cache with TTL in milliseconds
 * Default TTL: 5 minutes (300000ms)
 */
export function setCache<T>(key: string, data: T, ttlMs: number = 300000): void {
	cache.set(key, {
		data,
		expiresAt: Date.now() + ttlMs,
	});
}

/**
 * Clear a specific cache entry
 */
export function clearCache(key: string): void {
	cache.delete(key);
}

/**
 * Clear all expired cache entries
 */
export function clearExpiredCache(): void {
	const now = Date.now();
	for (const [key, entry] of cache.entries()) {
		if (now > entry.expiresAt) {
			cache.delete(key);
		}
	}
}

/**
 * Clear entire cache
 */
export function clearAllCache(): void {
	cache.clear();
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats() {
	return {
		size: cache.size,
		keys: Array.from(cache.keys()),
	};
}

// Run cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
	setInterval(clearExpiredCache, 600000);
}
