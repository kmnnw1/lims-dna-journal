'use client';

import Link from 'next/link';
import { Search, Plus, Settings, LogOut, Moon, Sun, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import { QuickFilterBar } from './QuickFilterBar';

const AnimatedFlask = dynamic(
	() => import('@/components/ui/AnimatedFlask').then(mod => mod.AnimatedFlask),
	{ ssr: false }
);

interface JournalHeaderProps {
	userName: string;
	userRole: string;
	searchQuery: string;
	setSearchQuery: (val: string) => void;
	filterType: 'all' | 'success' | 'error' | 'fav';
	onFilterChange: (val: 'all' | 'success' | 'error' | 'fav') => void;
	onSignOut: () => void;
	theme: 'light' | 'dark' | 'monet';
	setTheme: (val: 'light' | 'dark' | 'monet') => void;
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
}: JournalHeaderProps) {
	const roleColorClass = userRole === 'ADMIN'
		? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
		: userRole === 'EDITOR'
		? 'bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)]'
		: 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]';

	return (
		<header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 mt-2">
			<div className="flex items-center gap-4">
				<AnimatedFlask />
			</div>

			<div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
				<div className="relative flex-1 xl:w-[26rem] group flex items-center bg-[var(--md-sys-color-surface-container-high)] focus-within:bg-[var(--md-sys-color-surface)] border-2 border-transparent focus-within:border-[var(--md-sys-color-primary)] rounded-full transition-all pr-2">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md-sys-color-outline)] group-focus-within:text-[var(--md-sys-color-primary)] transition-colors pointer-events-none" />
					<input
						type="text"
						placeholder="Поиск по ID или таксону..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="flex-1 pl-12 pr-4 py-3.5 bg-transparent outline-none text-base placeholder:text-[var(--md-sys-color-outline)]"
					/>
					<div className="pl-2 border-l border-[var(--md-sys-color-outline-variant)]">
						<QuickFilterBar filterType={filterType} onFilterChange={onFilterChange} />
					</div>
				</div>

				{/* Кнопка смены темы (Цикл: Light -> Dark -> Monet) */}
				<button
					onClick={(e) => {
						const x = e.clientX;
						const y = e.clientY;
						document.documentElement.style.setProperty('--target-x', `${x}px`);
						document.documentElement.style.setProperty('--target-y', `${y}px`);
						const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'monet' : 'light';
						setTheme(next);
					}}
					title={`Тема: ${theme}`}
					className="p-3.5 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] md-elevation-1 hover:md-elevation-2 rounded-full transition-all flex items-center justify-center md-state-layer">
					{theme === 'light' ? <Moon className="w-5 h-5" /> : theme === 'dark' ? <Sparkles className="w-5 h-5 text-amber-500" /> : <Sun className="w-5 h-5" />}
				</button>

				{/* Кнопка "Новая проба" была удалена по запросу */}

				{/* Кнопка "Настройки / Профиль" */}
				<Link
					href="/admin"
					className={`flex items-center gap-2 px-5 py-3.5 md-elevation-1 hover:md-elevation-2 rounded-full transition-all font-medium md-state-layer ${userRole === 'ADMIN' ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]' : 'bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)]'}`}>
					<Settings className="w-5 h-5" />
					<span className="hidden sm:inline">{userRole === 'ADMIN' ? 'Настройки' : 'Профиль'}</span>
				</Link>

				{/* Кнопка "Выход" */}
				<button
					onClick={onSignOut}
					title="Выйти"
					className="p-3.5 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] md-elevation-1 hover:md-elevation-2 hover:bg-[var(--md-sys-color-surface-container-high)] rounded-full transition-all flex items-center justify-center md-state-layer">
					<LogOut className="w-5 h-5" />
				</button>
			</div>
		</header>
	);
}
