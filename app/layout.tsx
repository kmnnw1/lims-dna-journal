import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/ui/Providers';

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
		{ media: '(prefers-color-scheme: light)', color: '#f4f4f5' },
		{ media: '(prefers-color-scheme: dark)', color: '#0c0a09' },
	],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ru" suppressHydrationWarning>
			<body className="font-sans antialiased">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
