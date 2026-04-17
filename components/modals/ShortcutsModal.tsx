'use client';

import { Keyboard, X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

type Shortcut = {
	keys: string | string[];
	description: string;
	hint?: string;
};

type Props = { open: boolean; onClose: () => void; isReader: boolean };

const SHORTCUTS: (isReader: boolean) => Shortcut[] = (isReader) => [
	{ keys: ['/'], description: 'Фокус на поиск', hint: 'Работает почти везде' },
	{ keys: ['?'], description: 'Показать это окно', hint: 'Shift+/ для быстрого вызова' },
	{ keys: ['Ctrl+K', '⌘K'], description: 'Палитра команд', hint: 'Команды и глобальный поиск' },
	{ keys: ['Esc'], description: 'Закрыть окна', hint: 'Закрывает модальные окна и меню' },
	...(!isReader
		? [{ keys: ['N'], description: 'Новая проба', hint: 'Создать новую запись' }]
		: []),
];

function formatKeys(keys: string | string[]) {
	const kbdClass =
		'inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] font-mono text-sm font-bold shadow-sm';

	if (Array.isArray(keys)) {
		return keys
			.map((k) => (
				<kbd key={k} className={kbdClass}>
					{k}
				</kbd>
			))
			.reduce(
				(prev, curr, i) =>
					prev === null
						? [curr]
						: [
								...prev,
								<span
									key={`or-${i}`}
									className="mx-2 text-xs font-medium text-[var(--md-sys-color-outline)] uppercase tracking-wider"
								>
									или
								</span>,
								curr,
							],
				null as unknown as React.ReactElement[],
			);
	}
	return <kbd className={kbdClass}>{keys}</kbd>;
}

export function ShortcutsModal({ open, onClose, isReader }: Props) {
	const dialogRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open, onClose]);

	useEffect(() => {
		if (open && dialogRef.current) dialogRef.current.focus();
	}, [open]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm print:hidden">
			<button
				type="button"
				className="absolute inset-0 cursor-default"
				aria-label="Закрыть"
				onClick={onClose}
				tabIndex={-1}
			/>

			{/* MD3 Modal Surface */}
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-label="Горячие клавиши"
				tabIndex={0}
				className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-[var(--md-sys-color-surface-container-low)] shadow-2xl focus-visible:outline-none animate-in fade-in zoom-in-95 duration-200"
			>
				<div className="px-8 pt-8 pb-6 flex items-center justify-between bg-[var(--md-sys-color-surface-container)]">
					<h2 className="text-2xl font-normal text-[var(--md-sys-color-on-surface)] flex items-center gap-3">
						<Keyboard className="h-7 w-7 text-[var(--md-sys-color-primary)]" />
						Горячие клавиши
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-3 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				<div className="p-4 sm:p-8 space-y-2">
					{SHORTCUTS(isReader).map((row, idx) => (
						<div
							key={idx}
							className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-[1.5rem] hover:bg-[var(--md-sys-color-surface-container)] transition-colors"
						>
							<div className="flex flex-col gap-1">
								<span className="text-base font-medium text-[var(--md-sys-color-on-surface)]">
									{row.description}
								</span>
								{row.hint && (
									<span className="text-sm text-[var(--md-sys-color-outline)]">
										{row.hint}
									</span>
								)}
							</div>
							<div className="shrink-0 flex items-center">{formatKeys(row.keys)}</div>
						</div>
					))}
				</div>

				<div className="px-8 pb-8 text-center text-sm font-medium text-[var(--md-sys-color-outline)] opacity-70">
					Для доступа к клавишам клавиатура должна быть активна
				</div>
			</div>
		</div>
	);
}
