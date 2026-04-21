'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/layout/ThemeProvider';

interface ThemeToggleProps {
	className?: string;
	variant?: 'floating' | 'header';
}

export function ThemeToggle({ className = '', variant = 'floating' }: ThemeToggleProps) {
	const { theme, toggleTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);
	if (!mounted) return null;

	if (variant === 'header') {
		return (
			<button
				onClick={toggleTheme}
				title={`Переключить на ${theme === 'light' ? 'темную' : 'светлую'} тему`}
				className={`p-2.5 bg-(--md-sys-color-surface-container-low) text-(--md-sys-color-on-surface) md-elevation-1 hover:md-elevation-2 rounded-full transition-all flex items-center justify-center md-state-layer ${className}`}
			>
				{theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
			</button>
		);
	}

	return (
		<motion.button
			initial={{ opacity: 0, scale: 0.5 }}
			animate={{ opacity: 1, scale: 1 }}
			whileHover={{ scale: 1.1 }}
			whileTap={{ scale: 0.9 }}
			onClick={toggleTheme}
			className={`fixed top-6 right-6 z-[60] w-12 h-12 rounded-full bg-(--md-sys-color-surface-container-high) text-(--md-sys-color-on-surface-variant) shadow-lg flex items-center justify-center border border-(--md-sys-color-outline-variant)/20 backdrop-blur-md md-state-layer ${className}`}
			title="Сменить тему"
		>
			<AnimatePresence mode="wait">
				<motion.div
					key={theme}
					initial={{ rotate: -90, opacity: 0 }}
					animate={{ rotate: 0, opacity: 1 }}
					exit={{ rotate: 90, opacity: 0 }}
					transition={{ duration: 0.2 }}
				>
					{theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
				</motion.div>
			</AnimatePresence>
		</motion.button>
	);
}
