'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: (e?: React.MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>('light');
	const themeInitialized = useRef(false);

	// Load initial theme from localStorage or system preference
	useEffect(() => {
		if (typeof window === 'undefined') return;

		const saved = localStorage.getItem('theme') as Theme | null;
		const initial =
			saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

		setThemeState(initial);

		if (initial === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}

		themeInitialized.current = true;
	}, []);

	// Sync with DOM and localStorage
	useEffect(() => {
		if (typeof window === 'undefined' || !themeInitialized.current) return;

		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}

		localStorage.setItem('theme', theme);
	}, [theme]);

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
	};

	const toggleTheme = (e?: React.MouseEvent) => {
		const next = theme === 'light' ? 'dark' : 'light';

		// View Transition API support (optional but premium feel)
		const doc = document as Document & { startViewTransition?: (callback: () => void) => void };
		if (e && doc.startViewTransition) {
			const x = e.clientX;
			const y = e.clientY;
			document.documentElement.style.setProperty('--target-x', `${x}px`);
			document.documentElement.style.setProperty('--target-y', `${y}px`);

			doc.startViewTransition(() => {
				setTheme(next);
			});
		} else {
			setTheme(next);
		}
	};

	return (
		<ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}
