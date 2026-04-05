'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FlaskConical, Search, Plus, Settings, RefreshCw, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type Spec = { id: string; taxon?: string | null };

type Props = {
	open: boolean;
	onClose: () => void;
	specimens: Spec[];
	onPickSpecimen: (id: string) => void;
	onNewSpecimen: () => void;
	onRefresh: () => void;
	isReader: boolean;
	isAdmin: boolean;
};

export function CommandPalette({
	open,
	onClose,
	specimens,
	onPickSpecimen,
	onNewSpecimen,
	onRefresh,
	isReader,
	isAdmin,
}: Props) {
	const [q, setQ] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (open) {
			setQ('');
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	}, [open]);

	const filtered = useMemo(() => {
		const s = q.trim().toLowerCase();
		if (!s) return specimens.slice(0, 24);
		return specimens
			.filter(
				(x) =>
					x.id.toLowerCase().includes(s) ||
					(x.taxon && String(x.taxon).toLowerCase().includes(s)),
			)
			.slice(0, 40);
	}, [specimens, q]);

	const actions = useMemo(() => {
		const a: { id: string; label: string; icon: ReactNode; run: () => void }[] = [
			{ id: 'refresh', label: 'Обновить данные', icon: <RefreshCw className="h-5 w-5" />, run: onRefresh },
		];
		if (!isReader) {
			a.push({ id: 'new', label: 'Новая проба', icon: <Plus className="h-5 w-5" />, run: onNewSpecimen });
		}
		if (isAdmin) {
			a.push({ id: 'admin', label: 'Админ-панель', icon: <Settings className="h-5 w-5" />, run: () => window.location.assign('/admin') });
		}
		return a;
	}, [isReader, isAdmin, onNewSpecimen, onRefresh]);

	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				onClose();
			}
			if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
				const els = containerRef.current?.querySelectorAll<HTMLButtonElement>('button[data-cmd]');
				if (!els || els.length === 0) return;
				const first = els[0];
				const last = els[els.length - 1];
				const elsArray = Array.from(els);
				if (
					document.activeElement === inputRef.current ||
					!elsArray.includes(document.activeElement as HTMLButtonElement)
				) {
					(e.key === 'ArrowDown' ? first : last).focus();
					e.preventDefault();
				}
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [open, filtered.length, actions.length, onClose]);

	useEffect(() => {
		if (!open) return;
		const onClick = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		window.addEventListener('mousedown', onClick);
		return () => window.removeEventListener('mousedown', onClick);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[130] flex items-start justify-center bg-black/40 p-4 pt-[10vh] backdrop-blur-sm print:hidden">
			<div
				ref={containerRef}
				role="dialog"
				aria-modal="true"
				className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-[var(--md-sys-color-surface-container-low)] shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
				
				{/* MD3 Seamless Search Header */}
				<div className="flex items-center gap-4 px-6 py-4 bg-[var(--md-sys-color-surface-container)]">
					<Search className="h-6 w-6 shrink-0 text-[var(--md-sys-color-primary)]" aria-hidden />
					<input
						ref={inputRef}
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Команда или ID / таксон…"
						className="min-w-0 flex-1 bg-transparent py-3 text-xl outline-none placeholder:text-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)]"
						autoFocus
						autoComplete="off"
						onKeyDown={(e) => {
							if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
								const ul = containerRef.current?.querySelector('button[data-cmd]');
								if (ul) {
									(ul as HTMLButtonElement).focus();
									e.preventDefault();
								}
							}
						}}
					/>
					<kbd className="hidden sm:inline-flex items-center justify-center rounded-lg bg-[var(--md-sys-color-surface-container-highest)] px-3 py-1.5 font-mono text-sm font-medium text-[var(--md-sys-color-on-surface)] opacity-70">
						Esc
					</kbd>
				</div>

				<div className="max-h-[50vh] overflow-y-auto p-4 custom-scrollbar">
					{/* Actions Section */}
					<p className="mb-2 px-4 text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
						Действия
					</p>
					<ul className="space-y-1 mb-6">
						{actions.map((a) => (
							<li key={a.id}>
								<button
									type="button"
									data-cmd
									tabIndex={0}
									onClick={() => { a.run(); onClose(); }}
									className="flex w-full items-center gap-4 rounded-[1rem] px-4 py-3.5 text-left text-base font-medium transition-all hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] text-[var(--md-sys-color-on-surface)]"
									onKeyDown={(e) => {
										// Arrow navigation logic
										if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
									}}>
									<span className="text-[var(--md-sys-color-primary)] opacity-80">{a.icon}</span>
									{a.label}
								</button>
							</li>
						))}
					</ul>

					{/* Specimens Section */}
					<p className="mb-2 px-4 text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
						Пробы
					</p>
					<ul className="space-y-1">
						{filtered.length === 0 ? (
							<li className="px-4 py-6 text-center text-[var(--md-sys-color-outline)] text-base font-medium">
								Ничего не найдено
							</li>
						) : (
							filtered.map((s) => (
								<li key={s.id}>
									<button
										type="button"
										data-cmd
										tabIndex={0}
										onClick={() => { onPickSpecimen(s.id); onClose(); }}
										className="flex w-full items-center justify-between gap-4 rounded-[1rem] px-4 py-3 text-left transition-all hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]"
										title={s.taxon || undefined}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
										}}>
										<span className="min-w-0 truncate font-mono font-bold text-lg text-[var(--md-sys-color-primary)]">
											{s.id}
										</span>
										{s.taxon && (
											<span className="truncate text-[var(--md-sys-color-outline)] font-medium">
												{s.taxon}
											</span>
										)}
									</button>
								</li>
							))
						)}
					</ul>
				</div>

				<div className="flex items-center justify-between bg-[var(--md-sys-color-surface-container)] px-6 py-4 text-sm font-medium text-[var(--md-sys-color-outline)]">
					<span className="flex items-center gap-2">
						<FlaskConical className="h-4 w-4" /> Журнал ДНК
					</span>
					{isAdmin && (
						<Link href="/admin" className="inline-flex items-center gap-1.5 text-[var(--md-sys-color-primary)] hover:underline" onClick={onClose}>
							<ExternalLink className="h-4 w-4" /> Админ-панель
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}
