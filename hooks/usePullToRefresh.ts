'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Улучшенный pull-to-refresh у верхнего края страницы (touch):
 * - Корректно работает только при scrollY почти на самом верху (без ложных срабатываний)
 * - Можно использовать для любых элементов (не только body)
 * - Добавляет защиту от многократных refresh пока палец не отпущен
 * - Позволяет "тянуть" не только строго сверху (но только первые 8px scrollY)
 * - threshold и readOnly — легко изменяемые параметры
 */
export function usePullToRefresh(
	onRefresh: () => void | Promise<void>,
	disabled?: boolean,
	opts?: {
		/** Минимальное расстояние протяжки для срабатывания, px (default: 88) */
		threshold?: number;
		/** Разрешён ли refresh при input, textarea, или editable (default: false) */
		allowEditable?: boolean;
	},
) {
	const ref = useRef<HTMLDivElement>(null);
	const isRefreshing = useRef(false);

	const threshold = opts?.threshold ?? 88;
	const allowEditable = opts?.allowEditable ?? false;

	// Не триггерим refresh если фокус внутри input/textarea
	function isFocusInEditable(e: TouchEvent): boolean {
		if (allowEditable) return false;
		const el = e.target as HTMLElement | null;
		if (!el) return false;
		return el.closest("input, textarea, [contenteditable='true']") !== null;
	}

	useEffect(() => {
		const elem = ref.current;
		if (!elem || disabled) return;
		let armed = false;
		let startY = 0;
		let startX = 0;

		// touchstart может приходить даже после небольшого скролла — проверяем scrollY
		const onStart = (e: TouchEvent) => {
			if (window.scrollY > 8) return;
			if (isFocusInEditable(e)) return;
			if (isRefreshing.current) return;
			const touch = e.touches[0];
			startY = touch.clientY;
			startX = touch.clientX;
			armed = true;
		};

		const onMove = (e: TouchEvent) => {
			if (!armed) return;
			const touch = e.touches[0];
			const dy = touch.clientY - startY;
			const dx = touch.clientX - startX;
			// Защита от горизонтальных свайпов (например, для каруселей)
			if (Math.abs(dx) > Math.abs(dy)) {
				armed = false;
				return;
			}
			if (dy > threshold && !isRefreshing.current) {
				armed = false;
				isRefreshing.current = true;
				// Чтобы не ловить ошибки — используем .finally
				Promise.resolve(onRefresh()).finally(() => {
					isRefreshing.current = false;
				});
			}
		};

		const onEnd = () => {
			armed = false;
		};

		elem.addEventListener('touchstart', onStart, { passive: true });
		elem.addEventListener('touchmove', onMove, { passive: true });
		elem.addEventListener('touchend', onEnd, { passive: true });
		elem.addEventListener('touchcancel', onEnd, { passive: true });

		return () => {
			elem.removeEventListener('touchstart', onStart);
			elem.removeEventListener('touchmove', onMove);
			elem.removeEventListener('touchend', onEnd);
			elem.removeEventListener('touchcancel', onEnd);
		};
	}, [onRefresh, disabled, threshold, isFocusInEditable]);

	return ref;
}
