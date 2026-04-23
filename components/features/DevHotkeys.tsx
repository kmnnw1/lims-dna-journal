'use client';

import { useEffect } from 'react';
import { useDevSettings } from './DevSettingsProvider';

/**
 * Глобальный слушатель горячих клавиш для инструментов разработчика.
 * Позволяет восстановить панель, даже если она скрыта из UI.
 */
export const DevHotkeys: React.FC = () => {
	const { settings, setOverlayOpen, isOverlayOpen, setAnchorPos } = useDevSettings();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Простой парсинг 'Shift+D' или подобных
			const parts = settings.hotkey.split('+');
			const needsShift = parts.includes('Shift');
			const needsCtrl = parts.includes('Ctrl');
			const needsAlt = parts.includes('Alt');
			const key = parts[parts.length - 1].toUpperCase();

			if (
				e.key.toUpperCase() === key &&
				e.shiftKey === needsShift &&
				(e.ctrlKey || e.metaKey) === needsCtrl &&
				e.altKey === needsAlt
			) {
				e.preventDefault();

				// Если открываем, ставим анкор в центр экрана, если кнопка не видна
				if (!isOverlayOpen) {
					setAnchorPos({ x: window.innerWidth / 2 - 160, y: window.innerHeight / 2 });
				}

				setOverlayOpen(!isOverlayOpen);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [settings.hotkey, isOverlayOpen, setOverlayOpen, setAnchorPos]);

	return null;
};
