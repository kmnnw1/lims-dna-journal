import { Zap } from 'lucide-react';
import type { Metadata, Viewport } from 'next';
import { Montserrat, Outfit } from 'next/font/google';
import { useSession } from 'next-auth/react';
import { DevOverlay } from '@/components/features/DevOverlay';
import { DevSettingsProvider, useDevSettings } from '@/components/features/DevSettingsProvider';
import { PageTransition } from '@/components/layout/PageTransition';
import { Providers } from '@/components/layout/Providers';
import './globals.css';

const outfit = Outfit({
	subsets: ['latin'],
	variable: '--font-outfit',
	display: 'swap',
});

const montserrat = Montserrat({
	subsets: ['cyrillic', 'latin'],
	variable: '--font-montserrat',
	display: 'swap',
});

export const metadata: Metadata = {
	title: {
		default: 'Журнал проб ДНК',
		template: '%s | Журнал ДНК',
	},
	description: 'Учёт проб, выделения ДНК и журнал ПЦР для лаборатории',
	applicationName: 'Журнал ДНК',
	manifest: '/manifest.json',
	icons: {
		icon: [
			{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
			{ url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
			{ url: '/icon.svg', type: 'image/svg+xml' },
		],
		apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
	},
	appleWebApp: {
		capable: true,
		title: 'Журнал ДНК',
		statusBarStyle: 'black-translucent',
	},
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#fafdfb' },
		{ media: '(prefers-color-scheme: dark)', color: '#191c1b' },
	],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang="ru"
			className={`${outfit.variable} ${montserrat.variable} font-sans`}
			suppressHydrationWarning
		>
			{/* Внедряем базовые токены MD3: цвет фона (Surface) и цвет текста (On Surface).
				suppressHydrationWarning на body помогает избежать конфликтов с расширениями браузера.
			*/}
			<body
				suppressHydrationWarning
				className="min-h-screen bg-(--md-sys-color-surface) text-(--md-sys-color-on-surface) selection:bg-(--md-sys-color-primary) selection:text-(--md-sys-color-on-primary) transition-colors duration-300 font-sans antialiased"
			>
				<Providers>
					<DevSettingsProvider>
						<PageTransition>{children}</PageTransition>
						<DevOverlay />
						<DevToolsButton />
					</DevSettingsProvider>
				</Providers>
			</body>
		</html>
	);
}

/**
 * Плавающая кнопка вызова инструментов разработчика.
 * Видна всегда, позволяет быстро открыть оверлей.
 */
function DevToolsButton() {
	const { setOverlayOpen, isOverlayOpen } = useDevSettings();
	const { data: session } = useSession();

	const isAuthorized =
		session?.user?.name?.toLowerCase().includes('pavel') ||
		session?.user?.name?.toLowerCase().includes('asus') ||
		process.env.NODE_ENV === 'development';

	if (!isAuthorized || isOverlayOpen) return null;

	return (
		<button
			onClick={() => setOverlayOpen(true)}
			className="fixed bottom-6 right-6 z-9998 w-14 h-14 bg-(--md-sys-color-tertiary-container) text-(--md-sys-color-on-tertiary-container) rounded-2xl flex items-center justify-center md-elevation-2 hover:md-elevation-3 active:scale-90 transition-all group overflow-hidden"
			title="Инструменты разработчика"
		>
			<div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
			<Zap className="w-7 h-7" />
		</button>
	);
}
