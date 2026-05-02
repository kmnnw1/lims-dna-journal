'use client';

import { Printer } from 'lucide-react';

interface SelectionBarProps {
	selectedIds: Set<string>;
	setSelectedIds: (v: Set<string>) => void;
	onCopySelectedIds: () => void;
	onPrintLabels: () => void;
	onBatchPCR: () => void;
	onTakeInWork: () => void;
}

/**
 * Нижняя панель при выделении проб: счётчик, копирование ID, печать, массовый ПЦР.
 * Извлечена из JournalPageContent для снижения связности.
 */
export function SelectionBar({
	selectedIds,
	setSelectedIds,
	onCopySelectedIds,
	onPrintLabels,
	onBatchPCR,
	onTakeInWork,
}: SelectionBarProps) {
	if (selectedIds.size === 0) return null;

	return (
		<div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl bg-(--md-sys-color-inverse-surface) text-(--md-sys-color-inverse-on-surface) rounded-3xl p-4 flex items-center justify-between shadow-2xl z-50">
			<div className="flex items-center gap-4 pl-2">
				<button
					onClick={() => setSelectedIds(new Set())}
					className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
					title="Сбросить выделение"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="3"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
				<span className="flex items-center justify-center w-8 h-8 rounded-full bg-(--md-sys-color-inverse-primary) text-(--md-sys-color-primary) font-bold text-sm">
					{selectedIds.size}
				</span>
				<span className="font-medium">выбрано</span>
			</div>
			<div className="flex gap-2">
				<button
					onClick={onCopySelectedIds}
					className="px-5 py-2.5 text-sm font-medium text-(--md-sys-color-inverse-primary) hover:bg-white/10 rounded-full transition-colors flex items-center gap-2"
					title="Копировать все выбранные ID"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
					</svg>
					ID
				</button>
				<button
					onClick={onPrintLabels}
					className="px-5 py-2.5 text-sm font-medium text-(--md-sys-color-inverse-primary) hover:bg-white/10 rounded-full transition-colors flex items-center gap-2"
				>
					<Printer className="w-4 h-4" /> Печать
				</button>
				<button
					onClick={onBatchPCR}
					className="px-5 py-2.5 text-sm font-medium text-(--md-sys-color-inverse-primary) hover:bg-white/10 rounded-full transition-colors"
				>
					Массовый ПЦР
				</button>
				<button
					onClick={onTakeInWork}
					className="px-5 py-2.5 text-sm font-medium bg-(--md-sys-color-inverse-primary) text-(--md-sys-color-primary) rounded-full transition-colors"
				>
					В работу
				</button>
			</div>
		</div>
	);
}
