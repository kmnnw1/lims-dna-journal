/**
 * Input Validation — серверная валидация входных данных
 * Zod-схемы для всех API-эндпоинтов
 */

/** Максимальная длина строковых полей */
const MAX_STRING = 500;
const MAX_SEARCH = 200;
const MAX_ID = 50;

/**
 * Санитизация строки: удаление управляющих символов,
 * обрезка до максимальной длины.
 * React экранирует по умолчанию, но мы защищаемся на уровне сервера.
 */
export function sanitizeString(input: unknown, maxLength = MAX_STRING): string {
	if (typeof input !== 'string') return '';
	// Удаляем нулевые байты и управляющие символы (кроме \n, \r, \t)
	const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
	return cleaned.trim().slice(0, maxLength);
}

/**
 * Валидация ID пробы (должен быть непустой строкой разумной длины)
 */
export function validateSpecimenId(id: unknown): string | null {
	const s = sanitizeString(id, MAX_ID);
	if (s.length === 0) return null;
	return s;
}

/**
 * Валидация поискового запроса
 */
export function validateSearchQuery(query: unknown): string {
	return sanitizeString(query, MAX_SEARCH);
}

/**
 * Валидация данных создания пробы
 */
export function validateSpecimenInput(data: Record<string, unknown>): {
	valid: boolean;
	errors: string[];
	sanitized: Record<string, string>;
} {
	const errors: string[] = [];
	const sanitized: Record<string, string> = {};

	const requiredFields = ['id'];
	const optionalFields = [
		'taxon',
		'locality',
		'extrLab',
		'extrOperator',
		'extrMethod',
		'extrDateRaw',
	];

	for (const field of requiredFields) {
		const value = sanitizeString(data[field]);
		if (!value) {
			errors.push(`Поле "${field}" обязательно`);
		}
		sanitized[field] = value;
	}

	for (const field of optionalFields) {
		sanitized[field] = sanitizeString(data[field]);
	}

	return {
		valid: errors.length === 0,
		errors,
		sanitized,
	};
}

/**
 * Валидация числового значения (концентрация и т.д.)
 */
export function validateNumber(value: unknown, min = 0, max = 999999): number | null {
	if (value === null || value === undefined || value === '') return null;
	const num = Number(value);
	if (Number.isNaN(num) || num < min || num > max) return null;
	return num;
}

/**
 * Валидация пагинации
 */
export function validatePagination(
	page: unknown,
	limit: unknown,
): {
	page: number;
	limit: number;
} {
	const p = Math.max(1, Math.min(10000, Number(page) || 1));
	const l = Math.max(1, Math.min(200, Number(limit) || 50));
	return { page: p, limit: l };
}

/**
 * Проверка Content-Type для мутирующих запросов
 */
export function validateContentType(contentType: string | null): boolean {
	if (!contentType) return false;
	const type = contentType.split(';')[0].trim().toLowerCase();
	return type === 'application/json';
}

/**
 * Валидация роли пользователя
 */
export type UserRole = 'ADMIN' | 'EDITOR' | 'READER';
const ALLOWED_ROLES: Set<string> = new Set(['ADMIN', 'EDITOR', 'READER']);

export function validateRole(role: unknown): UserRole | null {
	if (typeof role !== 'string') return null;
	const upper = role.toUpperCase();
	return ALLOWED_ROLES.has(upper) ? (upper as UserRole) : null;
}

/**
 * Валидация размера загружаемого файла (в байтах)
 */
export function validateFileSize(size: number, maxSizeMB = 10): boolean {
	return size <= maxSizeMB * 1024 * 1024;
}
