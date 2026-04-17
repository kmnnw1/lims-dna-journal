'use client';

import { Check, LogOut, Moon, Plus, Search, Settings, Sparkles, Sun } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { QuickFilterBar } from './QuickFilterBar';

const AnimatedFlask = dynamic(
	() => import('@/components/ui/AnimatedFlask').then((mod) => mod.AnimatedFlask),
	{ ssr: false },
);

interface JournalHeaderProps {
	userName: string;
	userRole: string;
	searchQuery: string;
	setSearchQuery: (val: string) => void;
	filterType: 'all' | 'success' | 'error' | 'fav';
	onFilterChange: (val: 'all' | 'success' | 'error' | 'fav') => void;
	onSignOut: () => void;
	theme: 'light' | 'dark';
	setTheme: (val: 'light' | 'dark') => void;
	minConc: number | null;
	setMinConc: (val: number | null) => void;
	maxConc: number | null;
	setMaxConc: (val: number | null) => void;
	selectedOperator: string;
	setSelectedOperator: (val: string) => void;
	suggestions: { labs: string[]; operators: string[]; methods: string[] };
}

export function JournalHeader({
	userName,
	userRole,
	searchQuery,
	setSearchQuery,
	filterType,
	onFilterChange,
	onSignOut,
	theme,
	setTheme,
	minConc,
	setMinConc,
	maxConc,
	setMaxConc,
	selectedOperator,
	setSelectedOperator,
	suggestions,
}: JournalHeaderProps) {
	const _roleColorClass =
		userRole === 'ADMIN'
			? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
			: userRole === 'EDITOR'
				? 'bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)]'
				: 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]';

	return (
		<header className="flex items-center gap-3 mb-6 mt-1.5 px-1 sm:px-0 w-full">
			<div className="flex-shrink-0">
				<AnimatedFlask />
			</div>

			<div className="flex flex-1 items-center gap-2 min-w-0">
				{/* Группа поиска и быстрых фильтров */}
				<div className="flex-1 flex items-center gap-2 min-w-0">
					<div className="relative flex-1 group flex items-center bg-[var(--md-sys-color-surface-container-high)] focus-within:bg-[var(--md-sys-color-surface)] border-2 border-transparent focus-within:border-[var(--md-sys-color-primary)] rounded-full transition-all md-elevation-1 focus-within:md-elevation-2 pr-2 max-w-[45rem]">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[var(--md-sys-color-outline)] group-focus-within:text-[var(--md-sys-color-primary)] transition-colors pointer-events-none" />
						<input
							type="text"
							placeholder="Поиск..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="flex-1 pl-10 sm:pl-12 pr-2 py-2 sm:py-3 bg-transparent outline-none text-sm sm:text-base placeholder:text-[var(--md-sys-color-outline)]"
						/>

						{/* Встроенные статусы-фильтры */}
						<div className="hidden sm:flex items-center p-1 bg-[var(--md-sys-color-surface-container-low)] rounded-full mr-2">
							{[
								{ value: 'all', label: 'Все' },
								{ value: 'success', label: 'Успешные' },
								{ value: 'error', label: 'Ошибки' },
							].map((btn) => {
								const active = filterType === btn.value;
								return (
									<button
										key={btn.value}
										onClick={() => onFilterChange(btn.value as any)}
										className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
											active
												? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-sm'
												: 'text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)]'
										}`}
									>
										{active && <Check className="w-3 h-3" />}
										{btn.label}
									</button>
								);
							})}
						</div>

						<div className="pl-1 sm:pl-2 border-l border-[var(--md-sys-color-outline-variant)]">
							<QuickFilterBar
								filterType={filterType}
								onFilterChange={onFilterChange}
								minConc={minConc}
								setMinConc={setMinConc}
								maxConc={maxConc}
								setMaxConc={setMaxConc}
								selectedOperator={selectedOperator}
								setSelectedOperator={setSelectedOperator}
								suggestions={suggestions}
							/>
						</div>
					</div>
				</div>

				{/* Кнопки действий - Прижаты к правому краю */}
				<div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
					<button
						onClick={(e) => {
							const x = e.clientX;
							const y = e.clientY;
							document.documentElement.style.setProperty('--target-x', `${x}px`);
							document.documentElement.style.setProperty('--target-y', `${y}px`);
							const next = theme === 'light' ? 'dark' : 'light';
							setTheme(next);
						}}
						title={`Тема: ${theme}`}
						className="p-2 sm:p-2.5 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] md-elevation-1 hover:md-elevation-2 rounded-full transition-all flex items-center justify-center md-state-layer"
					>
						{theme === 'light' ? (
							<Moon className="w-4 h-4 sm:w-5 sm:h-5" />
						) : (
							<Sun className="w-4 h-4 sm:w-5 sm:h-5" />
						)}
					</button>

					<Link
						href="/admin"
						className={`flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-2.5 md-elevation-1 hover:md-elevation-2 rounded-full transition-all font-medium md-state-layer ${
							userRole === 'ADMIN'
								? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:brightness-110'
								: 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]'
						}`}
					>
						<Settings className="w-4 h-4 sm:w-5 sm:h-5" />
						<span className="hidden lg:inline text-sm">
							{userRole === 'ADMIN' ? 'Настройки' : 'Профиль'}
						</span>
					</Link>

					<button
						onClick={onSignOut}
						title="Выйти"
						className="p-2 sm:p-2.5 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] md-elevation-1 hover:md-elevation-2 hover:bg-[var(--md-sys-color-surface-container-high)] rounded-full transition-all flex items-center justify-center md-state-layer"
					>
						<LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
					</button>
				</div>
			</div>
		</header>
	);
}
