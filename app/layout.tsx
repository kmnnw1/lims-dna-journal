import { Zap } from 'lucide-react';
import type { Metadata, Viewport } from 'next';
import { Montserrat, Outfit } from 'next/font/google';
import { DevHotkeys } from '@/components/features/DevHotkeys';
import { DevOverlay } from '@/components/features/DevOverlay';
import { DevSettingsProvider } from '@/components/features/DevSettingsProvider';
import { DevToolsButton } from '@/components/features/DevToolsButton';
import { GlobalLensDrops } from '@/components/features/GlobalLensDrops';
import { OfflineIndicator } from '@/components/features/OfflineIndicator';
import { PageTransition } from '@/components/layout/PageTransition';
import { Providers } from '@/components/layout/Providers';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
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
					<ThemeProvider>
						<DevSettingsProvider>
							<DevHotkeys />
							<PageTransition>{children}</PageTransition>
							<DevOverlay />
							<DevToolsButton />
							<OfflineIndicator />
							<GlobalLensDrops />
						</DevSettingsProvider>
					</ThemeProvider>
				</Providers>
			</body>
		</html>
	);
}
