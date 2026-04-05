const FAVORITES_KEY = 'lj-favorite-ids';

/** Загружает избранные id из localStorage как Set<string> */
export function loadFavoriteIds(): Set<string> {
	try {
		const raw = localStorage.getItem(FAVORITES_KEY);
		if (typeof raw !== 'string' || !raw.trim()) return new Set();
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return new Set();
		// Безопасно фильтруем только строки, игнорируем лишнее
		const idSet = new Set<string>();
		for (const x of parsed) if (typeof x === 'string') idSet.add(x);
		return idSet;
	} catch (e) {
		// Можно залогировать e при необходимости
		return new Set();
	}
}

/** Сохраняет Set избранных id в localStorage */
export function saveFavoriteIds(ids: Set<string>) {
	try {
		// Отфильтруем на случай загрязнения set
		const arr = Array.from(ids).filter((id): id is string => typeof id === 'string');
		localStorage.setItem(FAVORITES_KEY, JSON.stringify(arr));
	} catch (_) {
		// Можно добавить логирование в dev-режиме
	}
}

/**
 * Тоглит id в Set: если есть — убирает, иначе добавляет (immutably).
 * Возвращает новый Set.
 */
export function toggleFavoriteId(ids: Set<string>, id: string): Set<string> {
	const next = new Set(ids);
	next.has(id) ? next.delete(id) : next.add(id);
	return next;
}
