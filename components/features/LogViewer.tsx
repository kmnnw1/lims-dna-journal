'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { useDevSettings } from './DevSettingsProvider';

/**
 * LogViewer - Панель просмотра логов консоли.
 * Вызывается через ПКМ на кнопке DevTools.
 * Дизайн: Темный, компактный, в стиле Vercel / Next.js Dev Tools.
 */
export const LogViewer: React.FC = () => {
	const { isLogViewerOpen, setLogViewerOpen, logs, clearLogs, settings, updateSettings } =
		useDevSettings();
	const scrollRef = useRef<HTMLDivElement>(null);

	// Автоматический скролл вниз при новых логах
	useEffect(() => {
		if (scrollRef.current && logs.length > 0) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [logs.length]);

	if (!isLogViewerOpen) return null;

	return (
		<AnimatePresence>
			{isLogViewerOpen && (
				<motion.div
					initial={{ opacity: 0, y: 20, scale: 0.95 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 20, scale: 0.95 }}
					className="fixed bottom-24 left-6 right-6 md:left-auto md:right-24 md:w-[600px] h-[400px] z-9998 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
				>
					{/* Header */}
					<div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
								<span className="text-[11px] font-bold text-white/90 uppercase tracking-widest">
									Console Logs
								</span>
							</div>
							<span className="text-[10px] font-mono text-white/30">
								{logs.length} записей
							</span>
						</div>
						<div className="flex items-center gap-1">
							<button
								onClick={clearLogs}
								className="p-1.5 hover:bg-white/10 rounded-md transition-colors group"
								title="Очистить логи"
							>
								<Trash2 className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80" />
							</button>
							<button
								onClick={() => setLogViewerOpen(false)}
								className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
							>
								<X className="w-3.5 h-3.5 text-white/40" />
							</button>
						</div>
					</div>

					{/* Log List */}
					<div
						ref={scrollRef}
						className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-1.5 scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40 scrollbar-track-transparent pr-2"
					>
						{logs.length === 0 ? (
							<div className="h-full flex items-center justify-center text-white/20 italic">
								Логов пока нет...
							</div>
						) : (
							logs.map((log, i) => (
								<div
									key={log.timestamp + i}
									className="flex gap-2 group leading-tight font-mono"
								>
									<span className="text-white/20 shrink-0 select-none">
										[
										{new Date(log.timestamp).toLocaleTimeString([], {
											hour12: false,
											hour: '2-digit',
											minute: '2-digit',
											second: '2-digit',
										})}
										]
									</span>
									<span
										className={`shrink-0 font-bold text-[10px] ${
											log.type === 'error'
												? 'text-red-500'
												: log.type === 'warn'
													? 'text-amber-500'
													: log.type === 'info'
														? 'text-blue-500'
														: 'text-white/40'
										}`}
									>
										[{log.type}]
									</span>
									<span
										className={`break-all ${
											log.type === 'error'
												? 'text-red-200'
												: log.type === 'warn'
													? 'text-amber-100'
													: 'text-white/80'
										}`}
									>
										{log.message}
									</span>
								</div>
							))
						)}
					</div>

					{/* Footer */}
					<div className="px-4 py-2 border-t border-white/5 bg-black/40 flex justify-between items-center">
						<div className="flex items-center gap-4">
							<span className="text-[9px] text-white/50 font-mono font-bold">
								{settings.logCleanupTimeout === 0
									? 'AUTO-CLEANUP DISABLED'
									: `AUTO-CLEANUP ACTIVE (${settings.logCleanupTimeout}S)`}
							</span>
							<div className="flex items-center gap-2">
								<span className="text-[8px] text-white/40 uppercase font-black">
									TTL:
								</span>
								<input
									type="number"
									value={settings.logCleanupTimeout}
									onChange={(e) =>
										updateSettings({
											...settings,
											logCleanupTimeout: Math.max(
												0,
												parseInt(e.target.value) || 0,
											),
										})
									}
									className="w-12 bg-white/10 border border-white/20 rounded px-1 text-[10px] text-white/80 focus:outline-none focus:border-white/50 transition-colors"
									title="Время жизни логов в секундах (0 = бесконечно)"
								/>
							</div>
						</div>
						<div className="text-[10px] text-white/40 font-bold italic tracking-tighter">
							DEV_LOG_SYSTEM
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
