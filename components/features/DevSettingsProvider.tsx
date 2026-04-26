'use client';

import { MotionConfig } from 'framer-motion';
import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Глобальные настройки инструментов разработчика
 */
export interface DevSettings {
	enableMobileCards: boolean;
	forceDesktopView: boolean;
	forceMobileView: boolean;
	useAI: boolean; // Использование Gemini при импорте
	hideNextIndicator: boolean; // Скрытие логотипа Next.js
	animationSpeed: number; // Множитель скорости анимаций (0.1 - 2.0)
	flaskEventMultiplier: number; // Множитель вероятностей редких событий колбы (1 - 100)
	visibility: {
		header: boolean;
		stats: boolean;
		filters: boolean;
		table: boolean;
		fab: boolean;
		erModel: boolean;
	};
	hotkey: string;
}

interface DevSettingsContextType {
	settings: DevSettings;
	updateSettings: (settings: DevSettings) => void;
	isOverlayOpen: boolean;
	setOverlayOpen: (open: boolean) => void;
	anchorPos: { x: number; y: number };
	setAnchorPos: (pos: { x: number; y: number }) => void;
}

const DevSettingsContext = createContext<DevSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'lab_journal_dev_settings';

export const DevSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [settings, setSettings] = useState<DevSettings>({
		enableMobileCards: false,
		forceDesktopView: false,
		forceMobileView: false,
		useAI: false,
		hideNextIndicator: false,
		animationSpeed: 1,
		flaskEventMultiplier: 1,
		visibility: {
			header: true,
			stats: true,
			filters: true,
			table: true,
			fab: true,
			erModel: false,
		},
		hotkey: 'Shift+D',
	});
	const [isOverlayOpen, setOverlayOpen] = useState(false);
	const [anchorPos, setAnchorPos] = useState({ x: 0, y: 0 });

	// Загружаем настройки из localStorage при старте
	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				setSettings((prev) => ({
					...prev,
					...parsed,
					// Гарантируем наличие вложенных объектов, если их нет в старом конфиге
					visibility: {
						...prev.visibility,
						...(parsed.visibility || {}),
					},
				}));
			} catch (e) {
				console.error('Ошибка парсинга настроек разработчика:', e);
			}
		}
	}, []);

	const updateSettings = (newSettings: DevSettings) => {
		setSettings(newSettings);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
	};

	return (
		<DevSettingsContext.Provider
			value={{
				settings,
				updateSettings,
				isOverlayOpen,
				setOverlayOpen,
				anchorPos,
				setAnchorPos,
			}}
		>
			<MotionConfig transition={{ duration: 0.4 / settings.animationSpeed }}>
				{children}
			</MotionConfig>
		</DevSettingsContext.Provider>
	);
};

export const useDevSettings = () => {
	const context = useContext(DevSettingsContext);
	if (!context) {
		throw new Error('useDevSettings must be used within a DevSettingsProvider');
	}
	return context;
};
