'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Компонент-индикатор отсутствия интернет-соединения.
 * Появляется плавно сверху при потере сети.
 */
export function OfflineIndicator() {
	const [isOffline, setIsOffline] = useState(false);

	useEffect(() => {
		const handleOnline = () => setIsOffline(false);
		const handleOffline = () => setIsOffline(true);

		setIsOffline(!navigator.onLine);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	return (
		<AnimatePresence>
			{isOffline && (
				<motion.div
					initial={{ y: -100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: -100, opacity: 0 }}
					className="fixed top-4 left-1/2 -translate-x-1/2 z-9999 pointer-events-none"
				>
					<div className="bg-(--md-sys-color-error-container) text-(--md-sys-color-on-error-container) px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-(--md-sys-color-error) backdrop-blur-md">
						<WifiOff className="w-5 h-5 animate-pulse" />
						<span className="font-medium text-sm">
							Автономный режим: данные загружаются из кэша
						</span>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
