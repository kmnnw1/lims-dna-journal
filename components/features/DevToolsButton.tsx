'use client';

import { Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useDevSettings } from './DevSettingsProvider';

/**
 * Плавающая кнопка вызова инструментов разработчика.
 * Вынесена в отдельный клиентский компонент для исключения конфликтов SSR.
 */
export function DevToolsButton() {
	const { setOverlayOpen, isOverlayOpen } = useDevSettings();
	const { data: session } = useSession();

	const isAuthorized =
		session?.user?.name?.toLowerCase().includes('pavel') ||
		session?.user?.name?.toLowerCase().includes('asus') ||
		session?.user?.name?.toLowerCase().includes('user') ||
		session?.user?.name?.toLowerCase().includes('пользователь') ||
		process.env.NODE_ENV === 'development';

	if (!isAuthorized || isOverlayOpen) return null;

	return (
		<button
			type="button"
			onClick={() => setOverlayOpen(true)}
			className="fixed bottom-6 right-6 z-9998 w-14 h-14 bg-(--md-sys-color-tertiary-container) text-(--md-sys-color-on-tertiary-container) rounded-2xl flex items-center justify-center md-elevation-2 hover:md-elevation-3 active:scale-90 transition-all group overflow-hidden"
			title="Инструменты разработчика"
		>
			<div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
			<Zap className="w-7 h-7" />
		</button>
	);
}
