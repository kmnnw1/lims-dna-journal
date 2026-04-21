'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useDevSettings } from './DevSettingsProvider';

/**
 * Плавающая кнопка вызова инструментов разработчика.
 * Вынесена в отдельный клиентский компонент для исключения конфликтов SSR.
 */
export function DevToolsButton() {
	const { setOverlayOpen, isOverlayOpen } = useDevSettings();

	const isAuthorized =
		process.env.NEXT_PUBLIC_OS_USER?.toLowerCase() === 'pavel' ||
		process.env.NEXT_PUBLIC_OS_USER?.toLowerCase() === 'asus';

	if (!isAuthorized || isOverlayOpen) return null;

	return (
		<motion.button
			type="button"
			drag
			dragElastic={0.1}
			whileHover={{ scale: 1.1 }}
			whileTap={{ scale: 0.9 }}
			onClick={() => setOverlayOpen(true)}
			className="fixed bottom-6 right-6 z-9998 w-14 h-14 bg-(--md-sys-color-tertiary-container) text-(--md-sys-color-on-tertiary-container) rounded-2xl flex items-center justify-center md-elevation-2 hover:md-elevation-3 transition-all group overflow-hidden"
			title="Инструменты разработчика"
		>
			<div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
			<Zap className="w-7 h-7" />
		</motion.button>
	);
}
