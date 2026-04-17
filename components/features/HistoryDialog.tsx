'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
	AlertCircle,
	ArrowRight,
	ChevronRight,
	Clock,
	Database,
	History,
	MapPin,
	Tag,
	User,
	X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface AuditLog {
	id: string;
	userId: string;
	action: string;
	resourceType: string;
	resourceId: string | null;
	details: string | null;
	changes: string | null;
	timestamp: string;
}

interface HistoryDialogProps {
	resourceId: string;
	resourceType: string;
	open: boolean;
	onClose: () => void;
	onRestoreSuccess?: () => void;
}

export function HistoryDialog({
	resourceId,
	resourceType,
	open,
	onClose,
	onRestoreSuccess,
}: HistoryDialogProps) {
	const [logs, setLogs] = useState<AuditLog[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchHistory = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await fetch(
				`/api/audit?resourceType=${resourceType}&resourceId=${resourceId}`,
			);
			if (!res.ok) throw new Error('Ошибка загрузки истории');
			const data = await res.json();
			setLogs(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
		} finally {
			setIsLoading(false);
		}
	}, [resourceId, resourceType]);

	useEffect(() => {
		if (open && resourceId) {
			fetchHistory();
		}
	}, [open, resourceId, fetchHistory]);

	const parseChanges = (changesStr: string | null) => {
		try {
			return changesStr ? JSON.parse(changesStr) : null;
		} catch {
			return null;
		}
	};

	const actionLabels: Record<string, string> = {
		CREATE_SPECIMEN: 'Создание пробы',
		UPDATE_SPECIMEN: 'Изменение данных',
		DELETE_SPECIMEN: 'Удаление (архивация)',
		PCR_ATTEMPT: 'Постановка ПЦР',
	};

	if (!open) return null;

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
					className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				/>

				<motion.div
					initial={{ opacity: 0, scale: 0.9, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.9, y: 20 }}
					className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-[var(--md-sys-color-surface-container-high)] rounded-[28px] shadow-2xl flex flex-col"
				>
					{/* Header */}
					<div className="flex items-center justify-between px-6 py-5 border-b border-[var(--md-sys-color-outline-variant)]/30">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
								<History className="w-5 h-5" />
							</div>
							<div>
								<h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] leading-tight">
									История пробы
								</h2>
								<p className="text-sm font-medium text-[var(--md-sys-color-primary)]">
									{resourceId}
								</p>
							</div>
						</div>
						<button
							onClick={onClose}
							className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] transition-colors"
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
						{isLoading ? (
							<div className="flex flex-col items-center justify-center py-12 gap-4">
								<div className="w-10 h-10 border-4 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
								<p className="text-[var(--md-sys-color-on-surface-variant)] font-medium">
									Загрузка истории...
								</p>
							</div>
						) : error ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<AlertCircle className="w-12 h-12 text-[var(--md-sys-color-error)] mb-3" />
								<p className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
									{error}
								</p>
								<button
									onClick={fetchHistory}
									className="mt-4 px-6 py-2 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full font-bold hover:shadow-lg transition-all"
								>
									Попробовать снова
								</button>
							</div>
						) : logs.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
								<Database className="w-12 h-12 mb-3" />
								<p className="text-lg font-medium">
									Логов для этой пробы не найдено
								</p>
							</div>
						) : (
							<div className="space-y-8 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-[var(--md-sys-color-outline-variant)]/20">
								{logs.map((log, idx) => {
									const changes = parseChanges(log.changes);

									return (
										<div key={log.id} className="relative pl-9">
											{/* Dot */}
											<div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[var(--md-sys-color-surface-container-highest)] border-2 border-[var(--md-sys-color-primary)] flex items-center justify-center z-10">
												<div className="w-2 h-2 rounded-full bg-[var(--md-sys-color-primary)]" />
											</div>

											<div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-sm">
												<div className="flex flex-wrap items-center justify-between gap-2 mb-3">
													<span className="px-3 py-1 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-[10px] font-black uppercase tracking-wider">
														{actionLabels[log.action] || log.action}
													</span>
													<div className="flex items-center gap-3 text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)]/70">
														<div className="flex items-center gap-1">
															<User className="w-3 h-3" />
															{log.userId === 'admin'
																? 'Системный администратор'
																: log.userId}
														</div>
														<div className="flex items-center gap-1">
															<Clock className="w-3 h-3" />
															{new Date(log.timestamp).toLocaleString(
																'ru-RU',
															)}
														</div>
													</div>
												</div>

												{/* Changes list */}
												{changes && Object.keys(changes).length > 0 ? (
													<div className="grid gap-2">
														{Object.entries(changes).map(
															([key, value]: [string, any]) => (
																<div
																	key={key}
																	className="flex flex-col gap-1 p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--md-sys-color-outline-variant)]/10"
																>
																	<div className="flex items-center gap-2 text-[10px] uppercase font-black text-[var(--md-sys-color-primary)] opacity-80">
																		<Tag className="w-3 h-3" />
																		{key}
																	</div>
																	<div className="flex items-center gap-2 text-xs font-medium">
																		<span className="flex-1 px-2 py-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 truncate">
																			{String(
																				value.old || '—',
																			)}
																		</span>
																		<ArrowRight className="w-3 h-3 text-[var(--md-sys-color-outline)] flex-shrink-0" />
																		<span className="flex-1 px-2 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 truncate">
																			{String(
																				value.new || '—',
																			)}
																		</span>
																	</div>
																</div>
															),
														)}
													</div>
												) : log.details ? (
													<p className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-highest)]/50 p-3 rounded-xl">
														{typeof JSON.parse(log.details) === 'object'
															? JSON.stringify(
																	JSON.parse(log.details),
																	null,
																	2,
																)
															: log.details}
													</p>
												) : (
													<p className="text-xs italic text-[var(--md-sys-color-on-surface-variant)] opacity-50">
														Детали изменения отсутствуют
													</p>
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="px-6 py-4 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)]/30 flex justify-end">
						<button
							onClick={onClose}
							className="px-6 py-2.5 rounded-full font-bold text-sm bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
						>
							Закрыть
						</button>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
}
