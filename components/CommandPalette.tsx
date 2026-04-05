'use client';

import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {FlaskConical, Search, Plus, Settings, RefreshCw, ExternalLink} from 'lucide-react';
import Link from 'next/link';

/** Тип экземпляра */
type Spec = {id: string; taxon?: string | null};

/** Пропсы командной палитры */
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

/** Командная палитра (улучшенная): фокус, быстрые действия, поиск, UX */
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

	// Фокусируем инпут при открытии, сбрасываем поиск
	useEffect(() => {
		if (open) {
			setQ('');
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	}, [open]);

	// Поиск по ID и таксону, с ограничением на вывод
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

	// Быстрые действия — формируются по ролям
	const actions = useMemo(() => {
		const a: {id: string; label: string; icon: ReactNode; run: () => void}[] = [
			{
				id: 'refresh',
				label: 'Обновить данные',
				icon: <RefreshCw className="h-4 w-4" />,
				run: onRefresh,
			},
		];
		if (!isReader) {
			a.push({
				id: 'new',
				label: 'Новая проба',
				icon: <Plus className="h-4 w-4" />,
				run: onNewSpecimen,
			});
		}
		if (isAdmin) {
			a.push({
				id: 'admin',
				label: 'Админ-панель',
				icon: <Settings className="h-4 w-4" />,
				run: () => {
					window.location.assign('/admin');
				},
			});
		}
		return a;
	}, [isReader, isAdmin, onNewSpecimen, onRefresh]);

	// Escape закрывает палитру, Down/Up — перемещение по списку (добавлено)
	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				onClose();
			}
			// Простая поддержка ↓/↑ для фокуса на первом/последнем элементе списка
			if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
				const els =
					containerRef.current?.querySelectorAll<HTMLButtonElement>('button[data-cmd]');
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

	// Клик вне палитры = закрытие (лучше UX)
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
		<div className="fixed inset-0 z-[130] flex items-start justify-center bg-zinc-950/55 p-4 pt-[12vh] backdrop-blur-sm print:hidden">
			<div
				ref={containerRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="cmd-palette-title"
				className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-600 dark:bg-zinc-900"
			>
				<div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
					<Search className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
					<input
						ref={inputRef}
						id="cmd-palette-title"
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Команда или ID / таксон…"
						className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400 dark:text-zinc-100"
						aria-label="Поиск команды или пробы"
						autoFocus
						autoComplete="off"
						onKeyDown={(e) => {
							// стрелки вниз/вверх — смещение фокуса на список
							if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
								const ul = containerRef.current?.querySelector('button[data-cmd]');
								if (ul) {
									(ul as HTMLButtonElement).focus();
									e.preventDefault();
								}
							}
						}}
					/>
					<kbd className="hidden rounded border border-zinc-200 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:inline dark:border-zinc-600">
						Esc
					</kbd>
				</div>
				<div className="max-h-[min(60vh,420px)] overflow-y-auto p-2 text-sm">
					<p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
						Действия
					</p>
					<ul className="space-y-0.5">
						{actions.map((a, i) => (
							<li key={a.id}>
								<button
									type="button"
									data-cmd
									tabIndex={0}
									onClick={() => {
										a.run();
										onClose();
									}}
									className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition hover:bg-teal-50 dark:hover:bg-teal-950/40`}
									onKeyDown={(e) => {
										// Навигация по кнопкам ↓/↑
										const parent = (e.target as HTMLElement).parentElement
											?.parentElement;
										if (!parent) return;
										const buttons = Array.from(
											parent.querySelectorAll<HTMLButtonElement>(
												'button[data-cmd],button[data-spec]',
											),
										);
										const idx = buttons.indexOf(
											e.currentTarget as HTMLButtonElement,
										);
										if (e.key === 'ArrowDown') {
											buttons[(idx + 1) % buttons.length]?.focus();
											e.preventDefault();
										} else if (e.key === 'ArrowUp') {
											buttons[
												(idx - 1 + buttons.length) % buttons.length
											]?.focus();
											e.preventDefault();
										} else if (e.key === 'Enter' || e.key === ' ') {
											e.currentTarget.click();
										}
									}}
								>
									{a.icon}
									{a.label}
								</button>
							</li>
						))}
					</ul>
					<p className="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
						Пробы
					</p>
					<ul className="space-y-0.5">
						{filtered.length === 0 ? (
							<li className="px-3 py-4 text-center text-zinc-500">
								Ничего не найдено
							</li>
						) : (
							filtered.map((s) => (
								<li key={s.id}>
									<button
										type="button"
										data-spec
										tabIndex={0}
										onClick={() => {
											onPickSpecimen(s.id);
											onClose();
										}}
										className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left font-mono text-xs transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
										title={s.taxon || undefined}
										onKeyDown={(e) => {
											// Навигация по ↑/↓ между specimen и actions
											const parent = (e.target as HTMLElement).parentElement
												?.parentElement;
											if (!parent) return;
											const buttons = Array.from(
												parent.querySelectorAll<HTMLButtonElement>(
													'button[data-cmd],button[data-spec]',
												),
											);
											const idx = buttons.indexOf(
												e.currentTarget as HTMLButtonElement,
											);
											if (e.key === 'ArrowDown') {
												buttons[(idx + 1) % buttons.length]?.focus();
												e.preventDefault();
											} else if (e.key === 'ArrowUp') {
												buttons[
													(idx - 1 + buttons.length) % buttons.length
												]?.focus();
												e.preventDefault();
											} else if (e.key === 'Enter' || e.key === ' ') {
												e.currentTarget.click();
											}
										}}
									>
										<span className="min-w-0 truncate font-semibold">
											{s.id}
										</span>
										{s.taxon ? (
											<span className="truncate text-zinc-500">
												{s.taxon}
											</span>
										) : null}
									</button>
								</li>
							))
						)}
					</ul>
				</div>
				<div className="flex items-center justify-between border-t border-zinc-100 px-3 py-2 text-[10px] text-zinc-400 dark:border-zinc-800">
					<span className="flex items-center gap-1">
						<FlaskConical className="h-3 w-3" /> Журнал
					</span>
					{isAdmin ? (
						<Link
							href="/admin"
							className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400"
							onClick={onClose}
						>
							<ExternalLink className="h-3 w-3" />
							Админ
						</Link>
					) : (
						<span>Ctrl+K</span>
					)}
				</div>
			</div>
		</div>
	);
}
