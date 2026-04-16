'use client';

import React, { useState, useEffect } from 'react';
import { X, History, RotateCcw, Clock, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HistoryEntry {
	id: string;
	userId: string;
	action: string;
	resourceId: string;
	resourceType: string;
	details: any;
	changes: Record<string, { old: any; new: any }> | null;
	timestamp: string;
}

interface Props {
	open: boolean;
	onClose: () => void;
	resourceId: string;
	resourceType: 'SPECIMEN' | 'PCR_ATTEMPT';
	onRestoreSuccess?: () => void;
}

export function HistoryDialog({ open, onClose, resourceId, resourceType, onRestoreSuccess }: Props) {
	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [restoringId, setRestoringId] = useState<string | null>(null);

	useEffect(() => {
		if (open && resourceId) {
			setLoading(true);
			fetch(`/api/history?resourceId=${resourceId}&resourceType=${resourceType}`)
				.then(res => res.json())
				.then(data => {
					setHistory(Array.isArray(data) ? data : []);
					setLoading(false);
				})
				.catch(() => {
					setHistory([]);
					setLoading(false);
				});
		}
	}, [open, resourceId, resourceType]);

	const handleRestore = async (logId: string) => {
		if (!confirm('Вы уверены, что хотите откатить данные к этой версии?')) return;
		
		setRestoringId(logId);
		try {
			const res = await fetch('/api/history', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ auditLogId: logId })
			});
			
			if (res.ok) {
				if (onRestoreSuccess) onRestoreSuccess();
				onClose();
			} else {
				const err = await res.json();
				alert(`Ошибка при откате: ${err.error}`);
			}
		} catch (e) {
			alert('Сетевая ошибка при попытке отката');
		} finally {
			setRestoringId(null);
		}
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
			<div className="w-full max-w-2xl bg-[var(--md-sys-color-surface-container-lowest)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
				{/* Header */}
				<div className="p-6 sm:p-8 flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]/20">
					<div className="flex items-center gap-3">
						<div className="p-3 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] rounded-2xl">
							<History className="w-6 h-6" />
						</div>
						<div>
							<h2 className="text-xl font-bold">История изменений</h2>
							<p className="text-sm opacity-60 font-mono">{resourceId}</p>
						</div>
					</div>
					<button onClick={onClose} className="p-2 hover:bg-[var(--md-sys-color-surface-container-high)] rounded-full transition-colors">
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* List */}
				<div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 custom-scrollbar">
					{loading ? (
						<div className="text-center py-12 text-[var(--md-sys-color-outline)]">Загрузка итераций...</div>
					) : history.length === 0 ? (
						<div className="text-center py-12 opacity-50">Истории изменений для этого ресурса пока нет</div>
					) : (
						history.map((entry) => (
							<div key={entry.id} className="p-5 bg-[var(--md-sys-color-surface-container-low)] rounded-3xl border border-[var(--md-sys-color-outline-variant)]/10">
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-2 text-sm font-medium">
										<Clock className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
										{new Date(entry.timestamp).toLocaleString()}
									</div>
									<div className="flex items-center gap-2 text-xs opacity-60">
										<User className="w-3 h-3" /> {entry.userId}
									</div>
								</div>

								<div className="mb-4 flex flex-wrap gap-2">
									<span className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-full ${
										entry.resourceType === 'PCR_ATTEMPT' 
											? 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]'
											: 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
									}`}>
										{entry.resourceType === 'PCR_ATTEMPT' ? 'ПЦР' : 'ПРОБА'} : {entry.action.replace('_SPECIMEN', '').replace('_PCR_ATTEMPT', '')}
									</span>
									{entry.details?.marker && (
										<span className="px-3 py-1 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] text-[10px] font-black tracking-widest uppercase rounded-full">
											{entry.details.marker}
										</span>
									)}
								</div>

								{entry.changes && (
									<div className="space-y-1 mt-3 text-xs bg-[var(--md-sys-color-surface-container)] p-4 rounded-2xl">
										{Object.entries(entry.changes).map(([key, val]) => (
											<div key={key} className="flex flex-wrap gap-x-2">
												<span className="font-bold opacity-70">{key}:</span>
												<span className="text-red-500 line-through decoration-1 opacity-60">{String(val.old || 'null')}</span>
												<span className="text-green-500 font-bold">→ {String(val.new || 'null')}</span>
											</div>
										))}
									</div>
								)}

								<div className="mt-4 flex justify-end">
									<Button
										variant="tonal"
										size="small"
										className="gap-2"
										onClick={() => handleRestore(entry.id)}
										disabled={restoringId !== null}
									>
										<RotateCcw className="w-4 h-4" />
										{restoringId === entry.id ? 'Восстановление...' : 'Откатить к этой версии'}
									</Button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
