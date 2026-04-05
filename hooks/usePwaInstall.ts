'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Тип для beforeinstallprompt с актуальными полями.
 * См. https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
 */
type BeforeInstallPrompt = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIosDevice(): boolean {
	if (typeof window === 'undefined') return false;
	return /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

function getStandaloneDisplay(): boolean {
	if (typeof window === 'undefined') return false;
	// Типичная эвристика: есть media feature и nav.standalone (Safari)
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		// @ts-expect-error: свойство нестандартное, но встречается в iOS Safari
		window.navigator.standalone === true
	);
}

/**
 * Хук управления установкой PWA:
 * - Ловит beforeinstallprompt для Android (Chrome/Edge/PWA)
 * - Показывает подсказку для iOS (у которых нет стандартного beforeinstallprompt)
 * - Определяет режим standalone
 */
export function usePwaInstall() {
	const [beforeInstall, setBeforeInstall] = useState<BeforeInstallPrompt | null>(null);
	const [iosShareHint, setIosShareHint] = useState(false);
	const [standalone, setStandalone] = useState(false);
	// Для подавления повторных setBeforeInstall (если несколько событий)
	const seenBipRef = useRef(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		// Проверяем состояние standalone и iOS при монтировании, а также при смене display-mode
		function updateState() {
			const currStandalone = getStandaloneDisplay();
			setStandalone(currStandalone);
			setIosShareHint(isIosDevice() && !currStandalone);
		}

		updateState();

		// Обрабатываем переход режима display-mode (например, пользователь установил как приложение)
		const mm = window.matchMedia('(display-mode: standalone)');
		const handler = () => updateState();
		if (mm.addEventListener) {
			mm.addEventListener('change', handler);
		} else {
			// Для старых браузеров
			mm.addListener(handler);
		}

		// Ловим beforeinstallprompt только если ещё не обработано
		function onBip(e: Event) {
			e.preventDefault(); // Block auto-prompt
			if (!seenBipRef.current) {
				setBeforeInstall(e as BeforeInstallPrompt);
				seenBipRef.current = true;
			}
		}

		window.addEventListener('beforeinstallprompt', onBip);

		// Очистка
		return () => {
			window.removeEventListener('beforeinstallprompt', onBip);
			if (mm.removeEventListener) {
				mm.removeEventListener('change', handler);
			} else {
				mm.removeListener(handler);
			}
		};
	}, []);

	/**
	 * Триггер ручного запроса установки PWA.
	 * После вызова сбрасывает beforeInstallPrompt.
	 */
	const promptInstall = useCallback(async () => {
		if (!beforeInstall) return;
		try {
			await beforeInstall.prompt();
			await beforeInstall.userChoice;
		} catch (e) {
			// Можно логировать ошибки, если нужно
		} finally {
			setBeforeInstall(null);
			seenBipRef.current = false;
		}
	}, [beforeInstall]);

	return {
		/** Доступна ли кнопка "Установить как приложение" */
		canPromptInstall: Boolean(beforeInstall) && !standalone,
		/** true, если на iOS (Safari) нужно показать инструкцию "Добавить на экран" */
		iosShareHint: iosShareHint && !standalone,
		/** Вызвать окно установки PWA (Chrome/Edge) */
		promptInstall,
		/** true если уже в режиме standalone (установлено как приложение) */
		standalone,
	};
}
