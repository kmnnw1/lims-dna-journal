import type { Metadata, Viewport } from 'next';
import { Outfit, Montserrat } from 'next/font/google';
import { Providers } from '@/components/layout/Providers';
import { PageTransition } from '@/components/layout/PageTransition';
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
		<html lang="ru" className={`${outfit.variable} ${montserrat.variable} font-sans`} suppressHydrationWarning>
			{/* Внедряем базовые токены MD3: цвет фона (Surface) и цвет текста (On Surface).
				suppressHydrationWarning на body помогает избежать конфликтов с расширениями браузера.
			*/}
			<body 
				suppressHydrationWarning
				className="min-h-screen bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] selection:bg-[var(--md-sys-color-primary)] selection:text-[var(--md-sys-color-on-primary)] transition-colors duration-300 font-sans antialiased"
			>
				<Providers>
					<PageTransition>{children}</PageTransition>
				</Providers>
			</body>
		</html>
	);
}
