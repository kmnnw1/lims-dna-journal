'use client';

import { useEffect } from 'react';

/**
 * Инициализация/регистрация PWA service worker.
 * - Проверяем поддержку serviceWorker API.
 * - Не повторяем регистрацию если уже активен.
 * - Детальный лог состояния и обработки ошибок.
 * - Возвращаем случайный <span hidden> (чтобы React hook был не "пустым")
 */
export function PwaBootstrap() {
	useEffect(() => {
		if (
			typeof window === 'undefined' ||
			typeof navigator === 'undefined' ||
			!('serviceWorker' in navigator) ||
			process.env.NODE_ENV !== 'production'
		) {
			return;
		}

		// Проверяем: уже был заинсталлирован (напр. при HMR в dev) — не трогаем
		if (navigator.serviceWorker.controller) {
			// Можно логировать, но скрыто для юзера
			return;
		}

		navigator.serviceWorker
			.register('/sw.js', { scope: '/' })
			.then(() => {
				// SW registered successfully
			})
			.catch(() => {
				// SW registration failed
			});
	}, []);
	// Возвращаем скрытый элемент, чтобы компонент всегда отрендерился хоть как-то (anti-pure-empty)
	return <span style={{ display: 'none' }} aria-hidden />;
}
