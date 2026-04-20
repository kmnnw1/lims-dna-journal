'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Глобальные настройки инструментов разработчика
 */
export interface DevSettings {
	enableMobileCards: boolean;
	forceDesktopView: boolean;
	forceMobileView: boolean;
}

interface DevSettingsContextType {
	settings: DevSettings;
	updateSettings: (settings: DevSettings) => void;
	isOverlayOpen: boolean;
	setOverlayOpen: (open: boolean) => void;
}

const DevSettingsContext = createContext<DevSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'lab_journal_dev_settings';

export const DevSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [settings, setSettings] = useState<DevSettings>({
		enableMobileCards: false,
		forceDesktopView: false,
		forceMobileView: false,
	});
	const [isOverlayOpen, setOverlayOpen] = useState(false);

	// Загружаем настройки из localStorage при старте
	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				setSettings(JSON.parse(saved));
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
			}}
		>
			{children}
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
