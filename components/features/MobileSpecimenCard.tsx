'use client';

import { Barcode, Camera, Activity, Share2, Copy, Star, Pencil } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { HighlightMatch } from '@/components/ui/HighlightMatch';

export type MobileSpecimenShape = {
	id: string;
	taxon?: string | null;
	locality?: string | null;
	notes?: string | null;
	extrLab?: string | null;
	extrOperator?: string | null;
	extrMethod?: string | null;
	imageUrl?: string | null;
	itsStatus?: string | null;
	ssuStatus?: string | null;
	lsuStatus?: string | null;
	mcm7Status?: string | null;
	attempts?: unknown[];
};

type Props = {
	s: MobileSpecimenShape;
	isReader: boolean;
	selected: boolean;
	onToggleSelect: () => void;
	onPcr: () => void;
	onEdit: () => void;
	renderStatus: (s: MobileSpecimenShape, marker: 'ITS' | 'SSU' | 'LSU' | 'MCM7') => ReactNode;
	favorite?: boolean;
	onToggleFavorite?: () => void;
	searchQuery?: string;
};

export function MobileSpecimenCard({
	s,
	isReader,
	selected,
	onToggleSelect,
	onPcr,
	onEdit,
	renderStatus,
	favorite,
	onToggleFavorite,
	searchQuery = '',
}: Props) {
	const [copied, setCopied] = useState(false);

	const copyId = async () => {
		try {
			await navigator.clipboard.writeText(s.id);
			setCopied(true);
			setTimeout(() => setCopied(false), 1200);
		} catch {}
	};

	const share = async () => {
		try {
			if (navigator.share) await navigator.share({ title: `Проба ${s.id}`, text: s.id });
			else await copyId();
		} catch {}
	};

	// Динамические стили для MD3. 
	// Если карточка выбрана, она становится Primary Container.
	let articleClass = 'transition-all duration-300 relative rounded-[2rem] p-5 shadow-sm ';
	if (selected) {
		articleClass += 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]';
	} else {
		articleClass += 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)]';
	}

	// Единый стиль кнопок MD3 (Tonal Icon Button)
	const btnClass = `touch-target transition rounded-full p-2.5 outline-none 
		${selected 
			? 'bg-[var(--md-sys-color-on-primary-container)]/10 hover:bg-[var(--md-sys-color-on-primary-container)]/20 text-[var(--md-sys-color-on-primary-container)]' 
			: 'bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]'
		} active:scale-95`;

	return (
		<article className={articleClass}>
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 flex-1 items-start gap-4">
					{!isReader && (
						<div className="relative flex items-center justify-center pt-1.5 shrink-0">
							<input
								type="checkbox"
								className="peer size-6 cursor-pointer appearance-none rounded-full border-2 border-[var(--md-sys-color-outline)] checked:border-[var(--md-sys-color-primary)] checked:bg-[var(--md-sys-color-primary)] transition-all"
								checked={selected}
								onChange={onToggleSelect}
								aria-label={selected ? 'Убрать выделение' : 'Выделить пробу'}
							/>
							<svg
								className="pointer-events-none absolute h-4 w-4 text-[var(--md-sys-color-on-primary)] opacity-0 peer-checked:opacity-100 transition-opacity mt-1.5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="3"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden>
								<polyline points="20 6 9 17 4 12"></polyline>
							</svg>
						</div>
					)}
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2 font-mono text-lg font-medium">
							<Barcode className={`h-5 w-5 shrink-0 ${selected ? 'opacity-80' : 'text-[var(--md-sys-color-outline)]'}`} aria-hidden />
							<span className="break-all tracking-tight">
								<HighlightMatch text={s.id} query={searchQuery} />
							</span>
							{s.imageUrl && (
								<a
									href={s.imageUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="shrink-0 p-1 rounded-full bg-[var(--md-sys-color-primary)]/10"
									title="Просмотреть гель">
									<Camera className="h-4 w-4 text-[var(--md-sys-color-primary)]" />
									<span className="sr-only">Гель</span>
								</a>
							)}
						</div>
						<p className={`mt-1 text-base leading-snug ${selected ? 'opacity-90' : 'text-[var(--md-sys-color-on-surface)]'}`}>
							{s.taxon || <span className="opacity-50">—</span>}
						</p>
						{s.locality && (
							<p className={`mt-1 truncate text-sm ${selected ? 'opacity-70' : 'text-[var(--md-sys-color-outline)]'}`}>
								{s.locality}
							</p>
						)}
					</div>
				</div>

				<div className="flex shrink-0 flex-col gap-2">
					<div className="flex justify-end gap-2">
						{onToggleFavorite && (
							<button
								type="button"
								onClick={onToggleFavorite}
								className={`${btnClass} ${favorite ? '!text-[#f59e0b]' : ''}`}
								aria-label={favorite ? 'Убрать из избранного' : 'В избранное'}
								title={favorite ? 'Убрать из избранного' : 'В избранное'}>
								<Star className={`h-4 w-4 transition-all ${favorite ? 'fill-current scale-110' : ''}`} />
							</button>
						)}
						<button
							type="button"
							onClick={copyId}
							className={`${btnClass} relative`}
							aria-label="Скопировать ID"
							title="Скопировать ID"
							disabled={copied}>
							<Copy className="h-4 w-4" />
							<span
								className={`absolute right-0 top-0 -translate-y-full text-[10px] px-2 py-1 rounded-lg whitespace-nowrap bg-[var(--md-sys-color-on-surface)] text-[var(--md-sys-color-surface)] transition pointer-events-none ${copied ? 'opacity-100' : 'opacity-0'}`}
								aria-live="polite">
								Скопировано
							</span>
						</button>
					</div>
					<div className="flex justify-end gap-2">
						{!isReader && (
							<button type="button" onClick={onEdit} className={btnClass} aria-label="Редактировать" title="Редактировать">
								<Pencil className="h-4 w-4" />
							</button>
						)}
						<button type="button" onClick={onPcr} className={`${btnClass} ${(s.attempts?.length ?? 0) > 0 ? '!bg-[var(--md-sys-color-primary)] !text-[var(--md-sys-color-on-primary)]' : ''}`} aria-label="PCR" title="PCR">
							<Activity className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>

			{s.notes && (
				<div className={`mt-5 p-4 rounded-2xl text-sm line-clamp-3 whitespace-pre-wrap break-words
					${selected ? 'bg-black/10' : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'}
				`}>
					{s.notes}
				</div>
			)}

			<div className={`mt-5 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t text-sm
				${selected ? 'border-[var(--md-sys-color-on-primary-container)]/20' : 'border-[var(--md-sys-color-outline-variant)]'}
			`}>
				<div className="flex flex-col gap-1">
					<p className={`text-xs font-medium tracking-wide uppercase ${selected ? 'opacity-70' : 'text-[var(--md-sys-color-primary)]'}`}>
						Выделение
					</p>
					<p className="font-medium">
						{s.extrLab || '—'}
						{s.extrOperator && <span className="font-normal opacity-70"> · {s.extrOperator}</span>}
					</p>
					<p className={`text-xs ${selected ? 'opacity-80' : 'text-[var(--md-sys-color-outline)]'}`}>
						{s.extrMethod || <span className="opacity-50">Нет данных</span>}
					</p>
				</div>

				<div className="flex flex-col gap-2">
					<p className={`text-xs font-medium tracking-wide uppercase ${selected ? 'opacity-70' : 'text-[var(--md-sys-color-primary)]'}`}>
						Маркеры
					</p>
					<div className="flex flex-wrap gap-2 items-center">
						{renderStatus(s, 'ITS')}
						{s.ssuStatus && renderStatus(s, 'SSU')}
						{s.lsuStatus && renderStatus(s, 'LSU')}
						{s.mcm7Status && renderStatus(s, 'MCM7')}
					</div>
				</div>
			</div>
		</article>
	);
}
