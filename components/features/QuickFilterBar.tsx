'use client';

import { Check, Filter, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface QuickFilterBarProps {
	filterType: 'all' | 'success' | 'error' | 'fav';
	onFilterChange: (filter: 'all' | 'success' | 'error' | 'fav') => void;
	minConc: number | null;
	setMinConc: (val: number | null) => void;
	maxConc: number | null;
	setMaxConc: (val: number | null) => void;
	selectedOperator: string;
	setSelectedOperator: (val: string) => void;
	suggestions: { labs: string[]; operators: string[]; methods: string[] };
}

export function QuickFilterBar({
	filterType,
	onFilterChange,
	minConc,
	setMinConc,
	maxConc,
	setMaxConc,
	selectedOperator,
	setSelectedOperator,
	suggestions,
}: QuickFilterBarProps) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const [activeMarkers, setActiveMarkers] = useState<Set<string>>(new Set(['ITS']));

	// Local states for the form (Apply logic)
	const [localMin, setLocalMin] = useState(minConc ?? 0);
	const [localMax, setLocalMax] = useState(maxConc ?? 200);
	const [localOperator, setLocalOperator] = useState(selectedOperator);

	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, []);

	const toggleMarker = (m: string) => {
		setActiveMarkers((prev) => {
			const next = new Set(prev);
			if (next.has(m)) next.delete(m);
			else next.add(m);
			return next;
		});
	};

	return (
		<div className="relative flex items-center h-full" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className={`flex items-center justify-center p-2 rounded-full transition-all duration-300 ${
					isOpen
						? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md'
						: 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
				}`}
				title="Фильтры"
			>
				<Filter className="w-5 h-5" />
			</button>

			{/* Dropdown Panel */}
			{isOpen && (
				<div className="absolute top-full right-0 mt-3 w-[340px] sm:w-[380px] z-[100] bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-3xl shadow-2xl overflow-hidden md-elevation-4 animate-in slide-in-from-top-4 fade-in duration-300">
					<div className="p-4 border-b border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between bg-[var(--md-sys-color-surface-container-low)]">
						<h3 className="font-bold text-base text-[var(--md-sys-color-on-surface)] tracking-tight">
							Фильтры
						</h3>
						<button
							onClick={() => setIsOpen(false)}
							className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)] transition-colors"
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					<div className="p-5 space-y-6">
						{/* Маркеры */}
						<div className="space-y-3">
							<label className="text-xs font-bold tracking-wider text-[var(--md-sys-color-outline)] uppercase">
								Специфичные маркеры
							</label>
							<div className="flex flex-wrap gap-2">
								{['ITS', 'SSU', 'LSU', 'RPB2', 'MCM7'].map((m) => {
									const active = activeMarkers.has(m);
									return (
										<button
											key={m}
											onClick={() => toggleMarker(m)}
											className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 border border-transparent flex items-center gap-1.5 ${
												active
													? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
													: 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
											}`}
										>
											{m}
											{active && <Check className="w-3.5 h-3.5 opacity-80" />}
										</button>
									);
								})}
							</div>
						</div>

						{/* Диапазон */}
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<label className="text-xs font-bold tracking-wider text-[var(--md-sys-color-outline)] uppercase">
									Концентрация ДНК
								</label>
								<span className="text-xs font-semibold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-2 py-0.5 rounded-full">
									{localMin} — {localMax} нг/мкл
								</span>
							</div>
							<div className="relative pt-4 px-2">
								{/* Real HTML5 dual slider hack or simple range */}
								<div className="relative h-2 rounded-full bg-[var(--md-sys-color-surface-container-high)]">
									<div
										className="absolute h-full bg-[var(--md-sys-color-primary)] rounded-full"
										style={{
											left: `${(localMin / 200) * 100}%`,
											right: `${100 - (localMax / 200) * 100}%`,
										}}
									/>
								</div>
								<input
									type="range"
									min="0"
									max="200"
									value={localMin}
									onChange={(e) => {
										const val = Math.min(Number(e.target.value), localMax - 1);
										setLocalMin(val);
									}}
									className="absolute w-full -top-1 left-0 h-4 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--md-sys-color-primary)] [&::-webkit-slider-thumb]:appearance-none"
								/>
								<input
									type="range"
									min="0"
									max="200"
									value={localMax}
									onChange={(e) => {
										const val = Math.max(Number(e.target.value), localMin + 1);
										setLocalMax(val);
									}}
									className="absolute w-full -top-1 left-0 h-4 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--md-sys-color-primary)] [&::-webkit-slider-thumb]:appearance-none"
								/>
							</div>
						</div>

						{/* Оператор */}
						<div className="space-y-3">
							<label className="text-xs font-bold tracking-wider text-[var(--md-sys-color-outline)] uppercase">
								Исполнитель (Лаборант)
							</label>
							<select
								value={localOperator}
								onChange={(e) => setLocalOperator(e.target.value)}
								className="w-full p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 text-[var(--md-sys-color-on-surface)] focus:bg-[var(--md-sys-color-surface-container-high)] outline-none text-sm font-medium transition-all"
							>
								<option value="">Любой</option>
								{suggestions.operators.map((op) => (
									<option key={op} value={op}>
										{op}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="p-4 bg-[var(--md-sys-color-surface-container-lowest)] border-t border-[var(--md-sys-color-outline-variant)]/30 flex justify-end gap-3">
						<button
							onClick={() => {
								setActiveMarkers(new Set());
								setLocalOperator('');
								setLocalMin(0);
								setLocalMax(200);
								setMinConc(null);
								setMaxConc(null);
								setSelectedOperator('');
								onFilterChange('all');
							}}
							className="px-5 py-2 rounded-full text-sm font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
						>
							Сбросить
						</button>
						<button
							onClick={() => {
								setMinConc(localMin);
								setMaxConc(localMax);
								setSelectedOperator(localOperator);
								setIsOpen(false);
							}}
							className="px-6 py-2 rounded-full text-sm font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 transition-opacity md-elevation-1"
						>
							Применить
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
